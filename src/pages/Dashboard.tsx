import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Thermometer, Droplets, Wind, Database } from 'lucide-react'
import { MetricCard } from '@/components/MetricCard'
import { Card } from '@/components/ui/card'
import { weatherApi, WeatherData } from '@/services/api'
import { useRealtimeWeather } from '@/hooks/useRealtimeWeather'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import React from 'react'

interface DashboardMetrics {
  avgTemperature?: number
  avgHumidity?: number
  avgWindSpeed?: number
  totalRecords?: number
}

interface TemperatureRange {
  range: string
  count: number
}

interface AnalyticsData {
  temperatureRanges: TemperatureRange[]
}

const formatMetricValue = (
  value: number | undefined,
  isCount: boolean = false
): string => {
  if (value === undefined || value === null) return '0'
  if (isCount) return value.toString()
  return value.toFixed(1)
}

export default function Dashboard() {
  const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([])
  const { latestData, isConnected } = useRealtimeWeather()

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard'],
    queryFn: async () => (await weatherApi.getDashboard())?.data ?? {},
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['analytics'],
    queryFn: async () =>
      (await weatherApi.getAnalytics())?.data ?? { temperatureRanges: [] },
  })

  const { data: initialWeather } = useQuery<WeatherData[]>({
    queryKey: ['weatherHistory'],
    queryFn: async () => (await weatherApi.getAll()) ?? [],
  })

  useEffect(() => {
    if (initialWeather?.length) {
      setWeatherHistory(initialWeather.slice(-20))
    }
  }, [initialWeather])

  useEffect(() => {
    if (latestData) {
      setWeatherHistory(prev => [...prev.slice(-19), latestData])
    }
  }, [latestData])

  const calculatedMetrics = useMemo((): DashboardMetrics => {
    if (!weatherHistory || weatherHistory.length === 0) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        avgWindSpeed: 0,
        totalRecords: 0,
      }
    }

    const sum = weatherHistory.reduce(
      (acc, item) => ({
        temperature: acc.temperature + (item.temperature || 0),
        humidity: acc.humidity + (item.humidity || 0),
        windSpeed: acc.windSpeed + (item.windSpeed || 0),
      }),
      { temperature: 0, humidity: 0, windSpeed: 0 }
    )

    return {
      avgTemperature: Number(
        (sum.temperature / weatherHistory.length).toFixed(1)
      ),
      avgHumidity: Number((sum.humidity / weatherHistory.length).toFixed(1)),
      avgWindSpeed: Number((sum.windSpeed / weatherHistory.length).toFixed(1)),
      totalRecords: weatherHistory.length,
    }
  }, [weatherHistory])

  const displayMetrics: DashboardMetrics = {
    avgTemperature:
      calculatedMetrics.avgTemperature ??
      metrics?.avgTemperature ??
      0,
    avgHumidity:
      calculatedMetrics.avgHumidity ??
      metrics?.avgHumidity ??
      0,
    avgWindSpeed:
      calculatedMetrics.avgWindSpeed ??
      metrics?.avgWindSpeed ??
      0,
    totalRecords:
      calculatedMetrics.totalRecords ??
      metrics?.totalRecords ??
      0,
  }

  interface TemperatureChartData {
    time: string
    temperature: number
    city: string
  }

  interface HumidityChartData {
    time: string
    humidity: number
  }

  // Se não houver histórico, exibe array vazio com 1 item padrão para gráficos
  const temperatureData: TemperatureChartData[] =
    weatherHistory.length > 0
      ? weatherHistory.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          temperature: item.temperature || 0,
          city: item.city || 'Unknown',
        }))
      : [{ time: '00:00', temperature: 0, city: 'Unknown' }]

  const humidityData: HumidityChartData[] =
    weatherHistory.length > 0
      ? weatherHistory.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          humidity: item.humidity || 0,
        }))
      : [{ time: '00:00', humidity: 0 }]

  const temperatureRanges =
    analytics?.temperatureRanges?.length > 0
      ? analytics.temperatureRanges
      : [{ range: '0-0', count: 0 }]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do monitoramento climático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-accent' : 'bg-destructive'
            }`}
          ></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Ao vivo' : 'Desconectado'}
          </span>
        </div>
      </div>

      {metricsError && (
        <p className="text-destructive text-sm mb-2">
          Não foi possível carregar métricas do servidor. Mostrando valores padrão.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Temperatura Média"
          value={formatMetricValue(displayMetrics?.avgTemperature)}
          subtitle="°C"
          icon={Thermometer}
          gradient="warning"
        />
        <MetricCard
          title="Umidade Média"
          value={formatMetricValue(displayMetrics?.avgHumidity)}
          subtitle="%"
          icon={Droplets}
          gradient="primary"
        />
        <MetricCard
          title="Velocidade Média do Vento"
          value={formatMetricValue(displayMetrics?.avgWindSpeed)}
          subtitle="km/h"
          icon={Wind}
          gradient="accent"
        />
        <MetricCard
          title="Total de Registros"
          value={formatMetricValue(displayMetrics?.totalRecords, true)}
          icon={Database}
          gradient="primary"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">
            Temperatura ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={temperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--warning))' }}
                name="Temperature (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4">
            Umidade ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={humidityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4">
          Distribuição de Temperatura
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={temperatureRanges}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="count"
              fill="hsl(var(--accent))"
              radius={[8, 8, 0, 0]}
              name="Registros"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

