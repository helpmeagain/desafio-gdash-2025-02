import { Injectable } from "@nestjs/common";
import { CreateWeatherDto } from "./dto/create-weather.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Weather, WeatherDocument } from "./schemas/weather.schema";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import * as ExcelJS from "exceljs";

@Injectable()
export class WeatherService {
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
    private readonly config: ConfigService
  ) {
    this.ollamaUrl = this.config.get<string>("OLLAMA_URL")!;
    this.ollamaModel = this.config.get<string>("OLLAMA_MODEL")!;
  }

  async create(createWeatherDto: CreateWeatherDto): Promise<Weather> {
    const createdWeather = new this.weatherModel(createWeatherDto);
    return createdWeather.save();
  }

  async findAll(): Promise<Weather[]> {
    return this.weatherModel.find().sort({ createdAt: -1 }).exec();
  }

  async exportCsv(): Promise<Buffer> {
    const data = await this.findAll();

    const headers = [
      "_id",
      "timestamp",
      "city",
      "state",
      "lat",
      "lon",
      "temperature_c",
      "humidity_percent",
      "wind_speed_kmh",
      "rain_probability",
      "condition_code",
      "source",
      "createdAt",
      "updatedAt",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = data.map((item) => {
      return [
        item._id ?? "",
        item.timestamp ?? "",
        item.location?.city ?? "",
        item.location?.state ?? "",
        item.location?.lat ?? "",
        item.location?.lon ?? "",
        item.weather?.temperature_c ?? "",
        item.weather?.humidity_percent ?? "",
        item.weather?.wind_speed_kmh ?? "",
        item.weather?.rain_probability ?? "",
        item.weather?.condition_code ?? "",
        item.source ?? "",
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\r\n");
    return Buffer.from(csv, "utf8");
  }

  async exportXlsx(): Promise<Buffer> {
    const data = await this.findAll();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Weather");

    sheet.columns = [
      { header: "_id", key: "_id", width: 32 },
      { header: "timestamp", key: "timestamp", width: 25 },
      { header: "city", key: "city", width: 20 },
      { header: "state", key: "state", width: 20 },
      { header: "lat", key: "lat", width: 12 },
      { header: "lon", key: "lon", width: 12 },
      { header: "temperature_c", key: "temperature_c", width: 15 },
      { header: "humidity_percent", key: "humidity_percent", width: 15 },
      { header: "wind_speed_kmh", key: "wind_speed_kmh", width: 15 },
      { header: "rain_probability", key: "rain_probability", width: 15 },
      { header: "condition_code", key: "condition_code", width: 15 },
      { header: "source", key: "source", width: 20 },
    ];

    data.forEach((item) => {
      sheet.addRow({
        _id: item._id ?? "",
        timestamp: item.timestamp ?? "",
        city: item.location?.city ?? "",
        state: item.location?.state ?? "",
        lat: item.location?.lat ?? "",
        lon: item.location?.lon ?? "",
        temperature_c: item.weather?.temperature_c ?? "",
        humidity_percent: item.weather?.humidity_percent ?? "",
        wind_speed_kmh: item.weather?.wind_speed_kmh ?? "",
        rain_probability: item.weather?.rain_probability ?? "",
        condition_code: item.weather?.condition_code ?? "",
        source: item.source ?? "",
      });
    });
    sheet.getRow(1).font = { bold: true };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateInsights() {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();

      let todayData = [];
      try {
        todayData = await this.weatherModel.find({
          createdAt: { $gte: start, $lte: end },
        });
      } catch (dbErr) {
        return { error: "Erro ao acessar os dados do clima." };
      }

      if (!todayData || todayData.length === 0) {
        return { insight: "Nenhum dado registrado hoje." };
      }
      const avgTempRaw =
        todayData.reduce((sum, w) => sum + (w.weather?.temperature_c ?? 0), 0) /
        todayData.length;

      const avgTemp = Number.isFinite(avgTempRaw) ? avgTempRaw : 0;

      const prompt = `
        Você é um analista climático. Gere um INSIGHT ESTRUTURADO baseado exclusivamente nos dados abaixo.

        DADOS DO DIA:
        - Registros coletados: ${todayData.length}
        - Temperatura média (°C): ${avgTemp.toFixed(1)}

        A resposta deve ser **exclusivamente** um JSON válido, seguindo exatamente o formato abaixo:

        {
          "resumo": "Resumo curto e direto sobre as condições gerais do dia.",
          "datalhes": "Seja mais verboso e mais detalhado sobre o dia, de forma amigável mas não informal sobre as condições atuais. Use em torno de três linhas",
          "avaliacao": "Avaliação objetiva sobre se o dia está quente, frio, úmido, seco, instável, etc.",
          "alertas": [
            "Lista de possíveis alertas relevantes. Se não houver alertas, devolva uma lista vazia."
          ],
          "tendencias": "Breve frase sobre possíveis tendências observadas nos dados.",
          "confianca": "Porcentagem de confiança na análise (ex: '82%')."
        }

        Não inclua comentários, explicações, markdown ou qualquer texto fora do JSON.
        `;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);

      let ollamaJson: any;

      try {
        const response = await fetch(this.ollamaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: this.ollamaModel,
            prompt,
            stream: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          return {
            error:
              "Falha ao gerar insight (Ollama não respondeu adequadamente).",
          };
        }

        ollamaJson = await response.json();
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          return { error: "Ollama demorou demais para responder (timeout)." };
        }
        return { error: "Erro de comunicação com o servidor de IA." };
      }
      const raw = ollamaJson?.response;
      if (!raw) {
        return { error: "Resposta vazia do modelo." };
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        return {
          error: "O modelo retornou um JSON inválido.",
          rawResponse: raw,
        };
      }

      return {
        insight: parsed,
        metadata: {
          registros: todayData.length,
          temperatura_media: avgTemp.toFixed(1),
        },
      };
    } catch (unexpected) {
      return { error: "Erro inesperado ao gerar insights." };
    }
  }
}
