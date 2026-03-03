import { useRealtimeWeather } from '@/hooks/useRealtimeWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useQuery } from '@tanstack/react-query'
import { weatherApi, WeatherData } from '@/services/api'
import { Card } from '@/components/ui/card'
import {
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  Wifi,
  WifiOff,
  Navigation,
  Globe,
  AlertTriangle,
} from 'lucide-react'

// Função segura para formatar números
const safeToFixed = (
  value: number | undefined | null,
  decimals: number = 1,
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A'
  }
  return value.toFixed(decimals)
}

export default function RealtimePage() {
  const { latestData, isConnected } = useRealtimeWeather()
  const { latitude, longitude, error: geoError, errorCode: geoErrorCode, loading: geoLoading } = useGeolocation()

  // ── Geolocalização do browser (exata) ──────────────────────────────────
  const { data: userLiveWeather, isLoading: userLiveLoading } = useQuery<WeatherData>({
    queryKey: ['userLiveWeather', latitude, longitude],
    queryFn: async () => {
      if (latitude && longitude) {
        return await weatherApi.getLiveWeather(latitude, longitude)
      }
      throw new Error('Localização não disponível')
    },
    enabled: !!latitude && !!longitude,
    refetchInterval: 30000,
  })

  // ── Fallback: IP Geolocation (quando browser falha por timeout/indisponibilidade) ──
  // Não usamos como fallback se o usuário negou permissão explicitamente
  const useIpFallback = !geoLoading && !!geoError && geoErrorCode !== 'PERMISSION_DENIED'

  const { data: ipWeather, isLoading: ipWeatherLoading } = useQuery<WeatherData>({
    queryKey: ['ipLiveWeather'],
    queryFn: () => weatherApi.getLiveWeatherByIp(),
    enabled: useIpFallback,
    refetchInterval: 60000, // Atualiza a cada 1 minuto (IP geo é menos preciso)
    retry: 1,
  })

  // A melhor fonte de dados para "Sua Localização"
  const locationData: WeatherData | undefined = userLiveWeather ?? ipWeather
  const locationLoading = userLiveLoading || (useIpFallback && ipWeatherLoading)

  // Determinar a origem da localização para o badge
  const locationSource: 'gps' | 'ip' | 'denied' | 'loading' | null = geoLoading
    ? 'loading'
    : latitude && longitude
    ? 'gps'
    : geoErrorCode === 'PERMISSION_DENIED'
    ? 'denied'
    : ipWeather
    ? 'ip'
    : null

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Tempo Real
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Monitoramento climático em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Sistema Conectado' : 'Sistema Desconectado'}
          </span>
        </div>
      </div>

      {/* ── SEÇÃO 1: SUA LOCALIZAÇÃO ──────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Sua Localização</h2>

          {/* Badge de origem da localização */}
          {locationSource === 'loading' && (
            <span className="text-xs text-muted-foreground animate-pulse bg-muted px-2 py-0.5 rounded-full">
              Obtendo GPS...
            </span>
          )}
          {locationSource === 'gps' && (
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
              <Navigation className="h-3 w-3" />
              GPS / Navegador
            </span>
          )}
          {locationSource === 'ip' && (
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
              <Globe className="h-3 w-3" />
              Aproximado por IP
            </span>
          )}
          {locationSource === 'denied' && (
            <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              <AlertTriangle className="h-3 w-3" />
              Permissão negada
            </span>
          )}
        </div>

        {/* Permissão negada: exibe aviso claro (sem fallback por IP pois o usuário escolheu negar) */}
        {geoErrorCode === 'PERMISSION_DENIED' ? (
          <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Permissão de localização negada</p>
                <p className="text-xs mt-1 opacity-80">
                  Para ver dados climáticos da sua localização exata, permita o acesso à localização nas configurações do seu navegador.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          /* Dados de localização — seja GPS, IP ou ainda carregando */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-4 md:p-6 shadow-card bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Temperatura no Local
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {locationLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `${safeToFixed(locationData?.temperature)}°C`
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {locationLoading ? 'Detectando...' : (locationData?.city || (geoLoading ? 'Detectando...' : 'Não disponível'))}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg shadow-sm">
                  <Thermometer className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 shadow-card bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Umidade no Local
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {locationLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `${safeToFixed(locationData?.humidity)}%`
                    )}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg shadow-sm">
                  <Droplets className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 shadow-card bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vento no Local
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {locationLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      `${safeToFixed(locationData?.windSpeed)} km/h`
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg shadow-sm">
                  <Wind className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            {/* Nota informativa quando usando localização por IP */}
            {locationSource === 'ip' && locationData && (
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  Localização aproximada detectada pelo IP da sua rede.
                  Para dados mais precisos, permita o acesso à localização no seu navegador.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── SEÇÃO 2: FLUXO GERAL DO SISTEMA ─────────────────────────── */}
      <section className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Wifi className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold">Fluxo Geral do Sistema (SP)</h2>
          <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">Stream Global</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-80 hover:opacity-100 transition-opacity">
          <Card className="p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Temperatura Coletada</p>
                <p className="text-xl font-bold">{safeToFixed(latestData?.temperature)}°C</p>
                <p className="text-xs text-muted-foreground mt-1">Cidade: {latestData?.city || '...'}</p>
              </div>
              <Thermometer className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Umidade Coletada</p>
                <p className="text-xl font-bold">{safeToFixed(latestData?.humidity)}%</p>
              </div>
              <Droplets className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Vento Coletado</p>
                <p className="text-xl font-bold">{safeToFixed(latestData?.windSpeed)} km/h</p>
              </div>
              <Wind className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>
      </section>

      {/* Mensagem quando não há dados */}
      {!latestData && !locationData && !locationLoading && (
        <Card className="p-8 text-center bg-muted/50">
          <div className="space-y-4">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Sincronizando...</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Aguardando os primeiros dados da rede e do seu navegador.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
