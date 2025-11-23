import { useRealtimeWeather } from '@/hooks/useRealtimeWeather'
import { Card } from '@/components/ui/card'
import {
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  Wifi,
  WifiOff,
} from 'lucide-react'

// Função segura para formatar números
const safeToFixed = (
  value: number | undefined | null,
  decimals: number = 1
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return 'N/A'
  }
  return value.toFixed(decimals)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWindSpeed = (data: any): number | null => {
  if (!data) return null

  const possiblePaths = [
    data.wind_speed,
    data.windSpeed, // Agora incluímos windSpeed
    data.data?.wind_speed,
    data.data?.windSpeed,
  ]

  for (const speed of possiblePaths) {
    if (speed !== undefined && speed !== null && !isNaN(Number(speed))) {
      return Number(speed)
    }
  }

  return null
}

export default function RealtimePage() {
  const { latestData, isConnected } = useRealtimeWeather()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tempo Real</h1>
          <p className="text-muted-foreground mt-1">
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
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Temperatura */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Temperatura
              </p>
              <p className="text-2xl font-bold">
                {/* CORREÇÃO: Use safeToFixed em vez de .toFixed() diretamente */}
                {safeToFixed(latestData?.temperature)}°C
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Thermometer className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>

        {/* Umidade */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Umidade
              </p>
              <p className="text-2xl font-bold">
                {/* CORREÇÃO: Use safeToFixed em vez de .toFixed() diretamente */}
                {safeToFixed(latestData?.humidity)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Droplets className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Velocidade do Vento */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Velocidade do Vento
              </p>
              <p className="text-2xl font-bold">
                {/* CORREÇÃO: Use getWindSpeed + safeToFixed */}
                {safeToFixed(latestData?.windSpeed)} km/h
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Wind className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Informações adicionais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Localização</h3>
          </div>
          <p className="text-muted-foreground">
            {latestData?.city || 'São Paulo'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Dados coletados em tempo real
          </p>
        </Card>

        <Card className="p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`h-3 w-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <h3 className="text-lg font-semibold">Status da Conexão</h3>
          </div>
          <p className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '🟢 Conectado e recebendo dados' : '🔴 Desconectado'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleTimeString()}
          </p>
        </Card>
      </div>

      {/* Mensagem quando não há dados */}
      {!latestData && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <WifiOff className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Aguardando dados</h3>
              <p className="text-muted-foreground mt-1">
                {isConnected
                  ? 'Conectado - aguardando primeiro envio de dados...'
                  : 'Estabelecendo conexão...'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
