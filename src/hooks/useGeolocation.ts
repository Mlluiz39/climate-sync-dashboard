import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  errorCode: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | null
  loading: boolean
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    errorCode: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo seu navegador',
        errorCode: 'POSITION_UNAVAILABLE',
        loading: false,
      }))
      return
    }

    const handleSuccess = (position: GeolocationPosition) => {
      console.log('🌍 Localização obtida:', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      })
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        errorCode: null,
        loading: false,
      })
    }

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro desconhecido ao obter localização'
      let errorCode: GeolocationState['errorCode'] = null
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada'
          errorCode = 'PERMISSION_DENIED'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informações de localização indisponíveis'
          errorCode = 'POSITION_UNAVAILABLE'
          break
        case error.TIMEOUT:
          errorMessage = 'Tempo limite esgotado ao obter localização'
          errorCode = 'TIMEOUT'
          break
      }
      setState(prev => ({
        ...prev,
        error: errorMessage,
        errorCode,
        loading: false,
      }))
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: false, // Busca mais rápida e menos propensa a timeout
      timeout: 10000,           // Aumentado para 10 segundos
      maximumAge: 60000,        // Aceita localização de até 1 minuto atrás (cache)
    })
  }, [])

  return state
}
