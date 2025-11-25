import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { weatherApi, WeatherData } from '@/services/api'
import { useRealtimeWeather } from '@/hooks/useRealtimeWeather'
import { RefreshCw, Download, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export default function WeatherTable() {
  const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([])
  const { latestData, isConnected } = useRealtimeWeather()

  const {
    data: weatherData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      try {
        const response = await weatherApi.getAll()
        return response
      } catch (error) {
        toast.error('Erro ao buscar dados climáticos.')
        throw error
      }
    },
  })

  // Inicializa o histórico com os dados da API
  useEffect(() => {
    if (weatherData) {
      setWeatherHistory(weatherData)
    }
  }, [weatherData])

  // Atualiza quando chegar novo dado em tempo real
  useEffect(() => {
    if (latestData) {
      setWeatherHistory(prev => {
        // Verifica se o dado já existe (evita duplicatas)
        const exists = prev.some(item => item.id === latestData.id)
        if (exists) {
          return prev
        }
        // Adiciona o novo dado no início da lista
        return [latestData, ...prev]
      })
    }
  }, [latestData])

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

  const displayData =
    weatherHistory.length > 0 ? weatherHistory : weatherData || []

  const handleExportCSV = () => {
    try {
      if (displayData.length === 0) {
        toast.error('Não há dados para exportar.')
        return
      }

      const headers = ['Data e Hora', 'Cidade', 'Temperatura (°C)', 'Umidade (%)', 'Velocidade do Vento (km/h)']
      const csvContent = [
        headers.join(','),
        ...displayData.map(item => {
          const date = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'
          return [
            `"${date}"`,
            `"${item.city || 'N/A'}"`,
            safeToFixed(item.temperature),
            safeToFixed(item.humidity),
            safeToFixed(item.windSpeed)
          ].join(',')
        })
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, 'dados_climaticos.csv')
      toast.success('Exportação CSV concluída!')
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast.error('Erro ao exportar CSV.')
    }
  }

  const handleExportExcel = () => {
    try {
      if (displayData.length === 0) {
        toast.error('Não há dados para exportar.')
        return
      }

      const dataToExport = displayData.map(item => ({
        'Data e Hora': item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
        'Cidade': item.city || 'N/A',
        'Temperatura (°C)': Number(safeToFixed(item.temperature)),
        'Umidade (%)': Number(safeToFixed(item.humidity)),
        'Velocidade do Vento (km/h)': Number(safeToFixed(item.windSpeed))
      }))

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Climáticos')
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, 'dados_climaticos.xlsx')
      toast.success('Exportação Excel concluída!')
    } catch (error) {
      console.error('Erro ao exportar Excel:', error)
      toast.error('Erro ao exportar Excel.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dados Climáticos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Ao vivo' : 'Desconectado'}
          </span>
        </div>
      </div>

      <Card className="shadow-card">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Registros</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Temperatura (°C)</TableHead>
                  <TableHead className="text-right">Umidade (%)</TableHead>
                  <TableHead className="text-right">
                    Velocidade do Vento (km/h)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.length > 0 ? (
                  displayData.map((record: WeatherData) => {
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.timestamp
                            ? new Date(record.timestamp).toLocaleString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{record.city || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          {safeToFixed(record.temperature)}
                        </TableCell>
                        <TableCell className="text-right">
                          {safeToFixed(record.humidity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {safeToFixed(record.windSpeed)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum dado encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
}
