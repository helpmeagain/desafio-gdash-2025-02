import * as React from "react";
import axios from "axios";
import api from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, FileDown, FileSpreadsheet } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Label } from "recharts";

interface WeatherLocation {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

interface WeatherInfo {
  temperature_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  rain_probability: number;
  condition_code: number;
}

interface WeatherLog {
  _id: string;
  timestamp: string;
  location: WeatherLocation;
  weather: WeatherInfo;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message?: string;
}

interface ChartPoint {
  time: string;
  temperature: number;
  humidity: number;
  rainProbability: number;
}

interface InsightContent {
  resumo: string;
  datalhes?: string;
  detalhes?: string;
  avaliacao: string;
  alertas: string[];
  tendencias: string;
  confianca: string;
}

interface InsightMetadata {
  registros: number;
  temperatura_media: string;
  date: string;
  cached: boolean;
}

interface WeatherInsight {
  insight: InsightContent;
  metadata: InsightMetadata;
}

const chartConfig = {
  temperature: {
    label: "Temperatura",
    color: "var(--chart-1)",
  },
  humidity: {
    label: "Umidade relativa",
    color: "var(--chart-2)",
  },
  rainProbability: {
    label: "Probabilidade de chuva",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatDateForInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTimeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapOpenMeteoCodeToDescription(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code === 1) return "Principalmente limpo";
  if (code === 2) return "Parcialmente nublado";
  if (code === 3) return "Nublado";

  if (code === 45 || code === 48) return "Nevoeiro";

  if (code >= 51 && code <= 57) return "Chuvisco";
  if (code >= 61 && code <= 65) return "Chuva";
  if (code === 66 || code === 67) return "Chuva congelante";

  if (code >= 71 && code <= 77) return "Neve";
  if (code >= 80 && code <= 82) return "Pancadas de chuva";
  if (code === 85 || code === 86) return "Pancadas de neve";

  if (code === 95) return "Trovoadas";
  if (code === 96 || code === 99) return "Trovoadas fortes";

  return "Condição desconhecida";
}

export default function ClimaPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const todayString = React.useMemo(() => formatDateForInput(new Date()), []);

  const rawDate = searchParams.get("date");
  const selectedDate = rawDate || todayString;

  const [logs, setLogs] = React.useState<WeatherLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [insights, setInsights] = React.useState<WeatherInsight | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = React.useState(false);
  const [insightsError, setInsightsError] = React.useState<string | null>(null);

  const [isExportingCsv, setIsExportingCsv] = React.useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = React.useState(false);

  React.useEffect(() => {
    if (!rawDate) {
      setSearchParams({ date: todayString });
    }
  }, [rawDate, setSearchParams, todayString]);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchWeather(date: string) {
      setIsLoading(true);
      setError(null);
      setLogs([]);

      try {
        const { data } = await api.get<WeatherLog[]>(
          "/weather/get-by-date/logs",
          {
            params: { date },
          }
        );

        if (cancelled) return;

        const sortedLogs = [...data].sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });

        setLogs(sortedLogs);
      } catch (err: unknown) {
        if (cancelled) return;

        if (axios.isAxiosError<ApiError>(err)) {
          const status = err.response?.status;

          if (status === 401) {
            setError("Sessão expirada, faça login novamente");
          } else if (status === 404) {
            setError("Nenhum dado climático encontrado para esta data");
          } else {
            setError(
              err.response?.data?.message ||
                "Erro ao carregar os dados climáticos"
            );
          }
        } else {
          setError("Erro inesperado ao carregar os dados climáticos");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (selectedDate) {
      fetchWeather(selectedDate);
      setInsights(null);
      setInsightsError(null);
      setIsInsightsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!value) return;
    setSearchParams({ date: value });
  }

  const chartData: ChartPoint[] = React.useMemo(
    () =>
      logs.map((log) => ({
        time: formatTimeLabel(log.timestamp),
        temperature: log.weather.temperature_c,
        humidity: log.weather.humidity_percent,
        rainProbability: log.weather.rain_probability,
      })),
    [logs]
  );

  const stats = React.useMemo(() => {
    if (logs.length === 0) return null;

    const temperatures = logs.map((log) => log.weather.temperature_c);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    const avg =
      temperatures.reduce((acc, t) => acc + t, 0) / temperatures.length;

    return {
      min,
      max,
      avg,
      count: logs.length,
    };
  }, [logs]);

  const location = logs[0]?.location;
  const latestLog = logs[logs.length - 1];
  const latestWeather = latestLog?.weather;
  const latestTimeLabel = latestLog
    ? formatTimeLabel(latestLog.timestamp)
    : null;

  async function handleGenerateInsights() {
    if (logs.length === 0) return;

    setIsInsightsLoading(true);
    setInsightsError(null);
    setInsights(null);

    try {
      const { data } = await api.get<WeatherInsight>(
        "/weather/get-by-date/insights",
        {
          params: { date: selectedDate },
        }
      );

      setInsights(data);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiError>(err)) {
        const status = err.response?.status;

        if (status === 401) {
          setInsightsError("Sessão expirada, faça login novamente");
        } else {
          setInsightsError(
            err.response?.data?.message || "Erro ao gerar insights climáticos"
          );
        }
      } else {
        setInsightsError("Erro inesperado ao gerar insights climáticos");
      }
    } finally {
      setIsInsightsLoading(false);
    }
  }

  async function handleExport(format: "csv" | "xlsx") {
    if (logs.length === 0) return;

    const setExporting =
      format === "csv" ? setIsExportingCsv : setIsExportingXlsx;
    const endpoint =
      format === "csv"
        ? "/weather/export-by-date/csv"
        : "/weather/export-by-date/xlsx";

    setExporting(true);

    try {
      const response = await api.get<Blob>(endpoint, {
        params: { date: selectedDate },
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "csv" ? "csv" : "xlsx";
      link.download = `clima-${selectedDate}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiError>(err)) {
        const status = err.response?.status;
        if (status === 401) {
          window.alert("Sessão expirada, faça login novamente para exportar.");
        } else {
          window.alert(
            err.response?.data?.message ||
              "Erro ao exportar os dados climáticos."
          );
        }
      } else {
        window.alert("Erro inesperado ao exportar os dados climáticos.");
      }
    } finally {
      setExporting(false);
    }
  }

  const detalhesInsight =
    insights?.insight.datalhes ?? insights?.insight.detalhes ?? "";

  const normalizedAlerts = insights
    ? insights.insight.alertas.filter((a) => a && a.trim().length > 0)
    : [];

  const hasAlerts = normalizedAlerts.length > 0;

  const canGenerateInsights = logs.length > 0 && !isInsightsLoading;

  const canExport = logs.length > 0 && !isLoading;

  const yDomain =
    stats != null
      ? ([Math.floor(stats.min - 1), Math.ceil(stats.max + 1)] as [
          number,
          number,
        ])
      : (["auto", "auto"] as ["auto", "auto"]);

  const yPercentDomain: [number, number] = [0, 100];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {location && (
              <div className="flex flex-col gap-2 ">
                <CardTitle>
                  {location.city}, {location.state}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Latitude {location.lat}, Longitude {location.lon}
                </p>
              </div>
            )}
            {!location && !isLoading && (
              <p className="text-sm text-muted-foreground">
                Selecione uma data para visualizar os dados climáticos
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <label className="text-xs font-medium text-muted-foreground">
              Data
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                  disabled={!canExport || isExportingCsv}
                  className="inline-flex items-center gap-1"
                >
                  {isExportingCsv ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>CSV</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="h-3 w-3" />
                      <span>CSV</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("xlsx")}
                  disabled={!canExport || isExportingXlsx}
                  className="inline-flex items-center gap-1"
                >
                  {isExportingXlsx ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>XLSX</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-3 w-3" />
                      <span>XLSX</span>
                    </>
                  )}
                </Button>
              </div>
              <Input
                type="date"
                value={selectedDate}
                max={todayString}
                onChange={handleDateChange}
                className="w-full sm:w-auto"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-md border p-3" key={index}>
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-7 w-20" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && stats && latestWeather && (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-md border border-white p-3 bg-primary/5">
                <p className="text-xs text-muted-foreground">
                  Temperatura atual{" "}
                  {latestTimeLabel && (
                    <span className="text-xs text-muted-foreground">
                      (última leitura às {latestTimeLabel})
                    </span>
                  )}
                </p>
                <p className="text-xl font-bold">
                  {latestWeather.temperature_c.toFixed(1)} °C
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Temperatura média
                </p>
                <p className="text-xl font-semibold">
                  {stats.avg.toFixed(1)} °C
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Temperatura mínima
                </p>
                <p className="text-xl font-semibold">
                  {stats.min.toFixed(1)} °C
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Temperatura máxima
                </p>
                <p className="text-xl font-semibold">
                  {stats.max.toFixed(1)} °C
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[280px] w-full rounded-md" />
            </div>
          )}

          {!isLoading && error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {!isLoading && !error && chartData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Nenhum dado climático disponível para esta data
            </p>
          )}

          {!isLoading && !error && chartData.length > 0 && (
            <>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[300px] w-full mb-5"
              >
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 40, right: 12, top: 10, bottom: 30 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  >
                    <Label
                      value="Horários"
                      position="insideBottom"
                      offset={-20}
                      className="fill-muted-foreground text-xs"
                    />
                  </XAxis>
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={yDomain}
                    tickFormatter={(value: number) => `${value.toFixed(1)} °C`}
                  >
                    <Label
                      value="Temperaturas (°C)"
                      angle={-90}
                      position="insideLeft"
                      offset={-20}
                      className="fill-muted-foreground text-xs"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="temperature"
                        labelFormatter={(value) => `Horário ${value}`}
                        indicator="line"
                      />
                    }
                  />
                  <Line
                    dataKey="temperature"
                    type="monotone"
                    stroke="var(--color-temperature)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>

              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[280px] w-full"
              >
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 40, right: 12, top: 10, bottom: 30 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  >
                    <Label
                      value="Horários"
                      position="insideBottom"
                      offset={-20}
                      className="fill-muted-foreground text-xs"
                    />
                  </XAxis>
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={yPercentDomain}
                    tickFormatter={(value: number) => `${value.toFixed(0)} %`}
                  >
                    <Label
                      value="Umidade e probabilidade de chuva(%)"
                      angle={-90}
                      position="insideLeft"
                      offset={-20}
                      className="fill-muted-foreground text-xs"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Line
                    dataKey="humidity"
                    type="monotone"
                    stroke="var(--color-humidity)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="rainProbability"
                    type="monotone"
                    stroke="var(--color-rainProbability)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </>
          )}

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="rounded-md border p-3" key={index}>
                  <Skeleton className="mb-2 h-3 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && latestWeather && (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Umidade relativa
                </p>
                <p className="text-lg font-semibold">
                  {latestWeather.humidity_percent} %
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Velocidade do vento
                </p>
                <p className="text-lg font-semibold">
                  {latestWeather.wind_speed_kmh.toFixed(1)} km/h
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">
                  Probabilidade de chuva
                </p>
                <p className="text-lg font-semibold">
                  {latestWeather.rain_probability} %
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Condição</p>
                <p className="text-lg font-semibold">
                  {mapOpenMeteoCodeToDescription(latestWeather.condition_code)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Insights climáticos com IA</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!insights && !isInsightsLoading && !insightsError && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Gere insights detalhados sobre o clima desta data utilizando
                inteligência artificial.
              </p>
              <Button
                onClick={handleGenerateInsights}
                disabled={!canGenerateInsights}
                className="inline-flex items-center gap-2"
              >
                <span>Gerar insights com IA</span>
              </Button>
            </div>
          )}

          {isInsightsLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Gerando insights com inteligência artificial
                </p>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          )}

          {insightsError && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{insightsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsights}
                disabled={!canGenerateInsights}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {insights && (
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground mb-1">Resumo</p>
                <p className="text-sm">{insights.insight.resumo}</p>
              </div>

              {detalhesInsight && (
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Detalhes</p>
                  <p className="text-sm">{detalhesInsight}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Avaliação
                  </p>
                  <p className="text-sm">{insights.insight.avaliacao}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Tendências
                  </p>
                  <p className="text-sm">{insights.insight.tendencias}</p>
                </div>
                <div className="rounded-md border p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    Nível de confiança
                  </p>
                  <p className="text-sm">
                    {insights.insight.confianca} de confiança
                  </p>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground mb-1">Alertas</p>
                {!hasAlerts && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum alerta relevante foi identificado para esta data.
                  </p>
                )}
                {hasAlerts && (
                  <ul className="list-disc pl-4 text-sm">
                    {normalizedAlerts.map((alerta) => (
                      <li key={alerta}>{alerta}</li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-right">
                {insights.metadata.registros} registros,
                {insights.metadata.cached
                  ? " resultado obtido de cache"
                  : " insights gerados em tempo real"}
              </p>
            </div>
          )}

          {insights && !isInsightsLoading && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsights}
                disabled={!canGenerateInsights}
                className="inline-flex items-center gap-2"
              >
                <span>Gerar novamente</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
