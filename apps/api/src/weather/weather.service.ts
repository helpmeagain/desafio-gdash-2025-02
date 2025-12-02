import { Injectable, BadRequestException } from "@nestjs/common";
import { CreateWeatherDto } from "./dto/create-weather.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Weather, WeatherDocument } from "./schemas/weather.schema";
import { ConfigService } from "@nestjs/config";
import { Model } from "mongoose";
import * as ExcelJS from "exceljs";
import {
  WeatherInsight,
  WeatherInsightDocument,
} from "./schemas/insight.schema";

@Injectable()
export class WeatherService {
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>,
    @InjectModel(WeatherInsight.name)
    private insightModel: Model<WeatherInsightDocument>,
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

  async findByDate(date?: string): Promise<Weather[]> {
    const { start, end } = this.parseDateRange(date);
    return this.weatherModel
      .find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async exportCsv(date?: string): Promise<Buffer> {
    const data = await this.findByDate(date);

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

  async exportXlsx(date?: string): Promise<Buffer> {
    const data = await this.findByDate(date);

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

  async generateInsights(date?: string) {
    try {
      const { start, end } = this.parseDateRange(date);
      const formattedDate = start.toISOString().slice(0, 10);

      const dayData = await this.weatherModel.find({
        createdAt: { $gte: start, $lte: end },
      });

      if (!dayData || dayData.length === 0) {
        return { insight: "Nenhum dado registrado na data informada." };
      }

      const recordCount = dayData.length;

      const existing = await this.insightModel.findOne({
        date: formattedDate,
      });

      if (existing && existing.recordCount === recordCount) {
        return {
          insight: existing.insight,
          metadata: {
            registros: existing.recordCount,
            date: formattedDate,
            cached: true,
          },
        };
      }

      const avgTemp =
        dayData.reduce((sum, w) => sum + (w.weather?.temperature_c ?? 0), 0) /
        recordCount;

      const prompt = `
        Você é um analista climático. Gere um INSIGHT ESTRUTURADO baseado exclusivamente nos dados abaixo.

        DATA: ${formattedDate}
        DADOS DO DIA:
        - Registros coletados: ${recordCount}
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

      let ollamaJson;

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
          return { error: "Falha ao gerar insight." };
        }

        ollamaJson = await response.json();
      } catch (err: any) {
        clearTimeout(timeout);
        return { error: "Erro ao comunicar com IA." };
      }

      const raw = ollamaJson?.response;
      if (!raw) return { error: "Resposta vazia da IA." };

      let parsedInsight;
      try {
        parsedInsight = JSON.parse(raw);
      } catch {
        return {
          error: "JSON retornado pela IA é inválido.",
          rawResponse: raw,
        };
      }

      await this.insightModel.findOneAndUpdate(
        { date: formattedDate },
        {
          date: formattedDate,
          recordCount,
          insight: parsedInsight,
        },
        { upsert: true, new: true }
      );

      return {
        insight: parsedInsight,
        metadata: {
          registros: recordCount,
          temperatura_media: avgTemp.toFixed(1),
          date: formattedDate,
          cached: false,
        },
      };
    } catch (err) {
      return { error: "Erro inesperado ao gerar insights." };
    }
  }

  private parseDateRange(date?: string): { start: Date; end: Date } {
    const isValidFormat = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
    let year: number, month: number, day: number;
    if (!date) {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
      day = now.getDate();
    } else {
      if (!isValidFormat(date)) {
        throw new BadRequestException(
          "Parâmetro 'date' inválido. Use YYYY-MM-DD."
        );
      }
      const parts = date.split("-");
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        month < 1 ||
        month > 12 ||
        day < 1 ||
        day > 31
      ) {
        throw new BadRequestException(
          "Parâmetro 'date' inválido. Use YYYY-MM-DD."
        );
      }
    }

    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);

    return { start, end };
  }
}
