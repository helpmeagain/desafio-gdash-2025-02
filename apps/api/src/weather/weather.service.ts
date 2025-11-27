import { Injectable } from "@nestjs/common";
import { CreateWeatherDto } from "./dto/create-weather.dto";
// import { UpdateWeatherDto } from "./dto/update-weather.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Weather, WeatherDocument } from "./schemas/weather.schema";
import { Model } from "mongoose";
import * as ExcelJS from "exceljs";

@Injectable()
export class WeatherService {
  constructor(
    @InjectModel(Weather.name) private weatherModel: Model<WeatherDocument>
  ) {}

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
}
