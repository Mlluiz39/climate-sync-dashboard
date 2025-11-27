import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo seu navegador',
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
        loading: false,
      })
    }

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro desconhecido ao obter localização'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Informações de localização indisponíveis'
          break
        case error.TIMEOUT:
          errorMessage = 'Tempo limite esgotado ao obter localização'
          break
      }
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    })
  }, [])

  return state
}
