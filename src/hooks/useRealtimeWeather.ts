// src/hooks/useRealtimeWeather.ts
import { useState, useEffect } from 'react'
import { REALTIME_WEATHER_URL, WeatherData } from '@/services/api'

export const useRealtimeWeather = () => {
  const [latestData, setLatestData] = useState<WeatherData | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource(REALTIME_WEATHER_URL)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        setLatestData(data)
      } catch (error) {
        console.error('Erro ao analisar dados SSE:', error)
      }
    }

    eventSource.onerror = error => {
      console.error('❌ Erro na conexão SSE:', error)
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return { latestData, isConnected }
}
