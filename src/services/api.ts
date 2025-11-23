import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface WeatherData {
  windSpeed: number
  id: string 
  timestamp: string
  temperature: number
  humidity: number
  city: string
}

export interface DashboardMetrics {
  windSpeed(windSpeed: any): string | number
  avgTemperature: number
  avgHumidity: number
  avgWindSpeed: number
  totalRecords: number
}

export interface AnalyticsData {
  temperatureRanges: {
    range: string
    count: number
  }[]
}

// API Methods - Ajustando para a estrutura de resposta do backend
export const weatherApi = {
  getAll: () => api.get<WeatherData[]>('/weather').then(res => res.data),
  getDashboard: () =>
    api.get<{ data: DashboardMetrics }>('/dashboard').then(res => res.data),
  getAnalytics: () =>
    api.get<{ data: AnalyticsData }>('/analytics').then(res => res.data),
}
