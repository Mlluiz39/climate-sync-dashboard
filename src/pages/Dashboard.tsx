import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Thermometer, Droplets, Wind, Database, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/MetricCard'
import { Card } from '@/components/ui/card'
import { weatherApi, WeatherData, BackendInsightsResponse, NormalizedInsightsResponse } from '@/services/api'
import { useRealtimeWeather } from '@/hooks/useRealtimeWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import { MapPin } from 'lucide-react'
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
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation()

  const { data: nearbyWeather, isLoading: nearbyLoading } = useQuery<WeatherData[]>({
    queryKey: ['nearbyWeather', latitude, longitude],
    queryFn: async () => {
      if (latitude && longitude) {
        return await weatherApi.getWeatherByLocation(latitude, longitude)
      }
      return []
    },
    enabled: !!latitude && !!longitude,
  })

  // Novo: Busca clima exato para a posição do usuário (Live)
  const { data: userLiveWeather, isLoading: userLiveLoading } = useQuery<WeatherData>({
    queryKey: ['userLiveWeather', latitude, longitude],
    queryFn: async () => {
      if (latitude && longitude) {
        return await weatherApi.getLiveWeather(latitude, longitude)
      }
      throw new Error('Localização não disponível')
    },
    enabled: !!latitude && !!longitude,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

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


  const {
    data: aiInsights,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useQuery<BackendInsightsResponse>({
    queryKey: ['aiInsights'],
    queryFn: async () => await weatherApi.getInsights(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false, // Não buscar automaticamente, apenas quando o usuário clicar
  })

  // Normalizar dados do backend para formato usado no frontend
  const normalizedInsights = useMemo((): NormalizedInsightsResponse | null => {
    if (!aiInsights) return null
    
    // Mapear estrutura do backend para estrutura do frontend
    return {
      insights: aiInsights.data.details, // Backend usa 'details' ao invés de 'insights'
      generatedAt: aiInsights.data.generated_at,
      summary: aiInsights.data.summary,
      context: aiInsights.data.context
    }
  }, [aiInsights])

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

  // Fallback calculation for temperature distribution
  const calculatedTemperatureRanges = useMemo(() => {
    if (analytics?.temperatureRanges?.length > 0) {
      return analytics.temperatureRanges
    }

    if (!weatherHistory || weatherHistory.length === 0) {
      return [{ range: '0-0', count: 0 }]
    }

    const ranges = {
      '< 10°C': 0,
      '10-20°C': 0,
      '20-30°C': 0,
      '> 30°C': 0,
    }

    weatherHistory.forEach(item => {
      const temp = item.temperature
      if (temp < 10) ranges['< 10°C']++
      else if (temp >= 10 && temp < 20) ranges['10-20°C']++
      else if (temp >= 20 && temp < 30) ranges['20-30°C']++
      else ranges['> 30°C']++
    })

    return Object.entries(ranges).map(([range, count]) => ({ range, count }))
  }, [analytics, weatherHistory])

  const temperatureRanges = calculatedTemperatureRanges

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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

      {/* Seção de Clima do Usuário (Destaque) */}
      {latitude && longitude && userLiveWeather && (
        <Card className="p-4 md:p-6 shadow-card bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Clima no seu Local Agora</h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{userLiveWeather.city}</span>
                  <span>•</span>
                  <span>{userLiveWeather.state || userLiveWeather.country}</span>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium ml-2">
                    Sua Localização
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-8 py-2 md:py-0">
              <div className="flex items-center gap-3">
                <Thermometer className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-xs text-muted-foreground">Temperatura</p>
                  <p className="text-xl font-bold">{formatMetricValue(userLiveWeather.temperature)}°C</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Umidade</p>
                  <p className="text-xl font-bold">{formatMetricValue(userLiveWeather.humidity)}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wind className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Vento</p>
                  <p className="text-xl font-bold">{formatMetricValue(userLiveWeather.windSpeed)} km/h</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 md:p-6 shadow-card">
          <h3 className="text-base md:text-lg font-semibold mb-4">
            Temperatura ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
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

        <Card className="p-4 md:p-6 shadow-card">
          <h3 className="text-base md:text-lg font-semibold mb-4">
            Umidade ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
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

      <Card className="p-4 md:p-6 shadow-card">
        <h3 className="text-base md:text-lg font-semibold mb-4">
          Distribuição de Temperatura
        </h3>
        <ResponsiveContainer width="100%" height={250} className="md:h-[300px]">
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

      <Card className="p-4 md:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-base md:text-lg font-semibold">
            Clima nas Proximidades
          </h3>
        </div>

        {latitude && longitude && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Sua localização detectada:</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-medium">Latitude:</span>
                <code className="px-2 py-0.5 bg-muted rounded text-xs">{latitude.toFixed(6)}</code>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Longitude:</span>
                <code className="px-2 py-0.5 bg-muted rounded text-xs">{longitude.toFixed(6)}</code>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Raio:</span>
                <code className="px-2 py-0.5 bg-muted rounded text-xs">50 km</code>
              </div>
            </div>
          </div>
        )}

        {geoLoading ? (
          <p className="text-muted-foreground text-sm">Obtendo sua localização...</p>
        ) : geoError ? (
          <p className="text-destructive text-sm">
            Não foi possível obter sua localização para mostrar dados próximos.
          </p>
        ) : nearbyLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : nearbyWeather && nearbyWeather.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2 font-medium">Cidade</th>
                  <th className="py-2 font-medium">Temp</th>
                  <th className="py-2 font-medium">Umidade</th>
                  <th className="py-2 font-medium">Vento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {nearbyWeather.map((item, index) => (
                  <tr key={index} className="group hover:bg-muted/50 transition-colors">
                    <td className="py-3 font-medium">{item.city}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-warning" />
                        {formatMetricValue(item.temperature)}°C
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-primary" />
                        {item.humidity}%
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Wind className="h-3 w-3 text-accent" />
                        {item.windSpeed} km/h
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Nenhuma estação meteorológica encontrada num raio de 50km.
          </p>
        )}
      </Card>


      <Card className="p-4 md:p-6 shadow-card bg-gradient-to-br from-card to-accent/5 border-accent/20">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="text-base md:text-lg font-semibold">Insights de IA</h3>
          </div>
          <Button
            onClick={() => refetchInsights()}
            disabled={insightsLoading}
            className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 w-full sm:w-auto"
          >
            {insightsLoading ? 'Gerando...' : 'Gerar Análise'}
          </Button>
        </div>

        {insightsError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Erro ao carregar insights. Verifique se o backend está rodando.
            </p>
          </div>
        )}

        {!normalizedInsights && !insightsLoading && !insightsError && (
          <p className="text-muted-foreground">
            Análise preditiva e recomendações baseadas nos dados climáticos.
            Clique em "Gerar Análise" para obter insights detalhados com inteligência artificial.
          </p>
        )}

        {insightsLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        )}

        {normalizedInsights && normalizedInsights.insights && normalizedInsights.insights.length > 0 && (
          <div className="space-y-4">
            {normalizedInsights.summary && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm text-primary">Resumo da Análise</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {normalizedInsights.summary}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {normalizedInsights.insights.map((insight, index) => {
                const getIcon = (category: string) => {
                  switch (category.toLowerCase()) {
                    case 'temperature': return <Thermometer className="h-4 w-4" />
                    case 'humidity': return <Droplets className="h-4 w-4" />
                    case 'wind': return <Wind className="h-4 w-4" />
                    default: return <Sparkles className="h-4 w-4" />
                  }
                }

                const getTitle = (category: string) => {
                  switch (category.toLowerCase()) {
                    case 'temperature': return 'Temperatura'
                    case 'humidity': return 'Umidade'
                    case 'wind': return 'Vento'
                    default: return 'Geral'
                  }
                }

                return (
                  <div
                    key={index}
                    className="p-4 bg-card/50 border border-border/50 rounded-lg hover:border-accent/30 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-full bg-accent/10 text-accent">
                        {getIcon(insight.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm capitalize">
                            {getTitle(insight.category)}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                            {insight.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {normalizedInsights.generatedAt && (
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t border-border/50">
                <span>Gerado em: {new Date(normalizedInsights.generatedAt).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        )}


        {normalizedInsights && (!normalizedInsights.insights || normalizedInsights.insights.length === 0) && !insightsLoading && (
          <div className="space-y-3">
            {normalizedInsights.summary && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium mb-1">📊 Resumo da Análise</p>
                <p className="text-sm text-muted-foreground">
                  {normalizedInsights.summary}
                </p>
              </div>
            )}
            {normalizedInsights.context && (
              <p className="text-xs text-muted-foreground">
                Análise baseada em {normalizedInsights.context.dataPointsAnalyzed} pontos de dados.
              </p>
            )}
            {normalizedInsights.generatedAt && (
              <p className="text-xs text-muted-foreground text-right">
                Gerado em: {new Date(normalizedInsights.generatedAt).toLocaleString('pt-BR')}
              </p>
            )}
            <p className="text-muted-foreground text-sm italic mt-2">
              Nenhum insight específico foi gerado nesta análise.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

