import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@beauty-platform/ui'
import { Plus, Building2, Users, MapPin, Clock, MoreVertical, Loader2, AlertCircle } from 'lucide-react'
import { apiService } from '../services/api'

type SalonStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED'

interface SalonSummary {
  id: string
  name: string
  slug: string
  city?: string | null
  address?: string | null
  status: SalonStatus
  isActive: boolean
  currency: string
  language: string
  timezone: string
  createdAt: string
  updatedAt: string
  staffCount: number
  clientsCount: number
  servicesCount: number
}

interface SalonsResponse {
  success: boolean
  data: SalonSummary[]
  totals?: {
    salons: number
    active: number
    inactive: number
  }
}

const statusStyles: Record<SalonStatus, { label: string; dot: string }> = {
  ACTIVE: { label: 'Активен', dot: 'bg-green-500' },
  INACTIVE: { label: 'Выключен', dot: 'bg-gray-400' },
  PENDING: { label: 'Ожидает', dot: 'bg-yellow-500' },
  SUSPENDED: { label: 'Заморожен', dot: 'bg-orange-500' },
  DELETED: { label: 'Удалён', dot: 'bg-red-500' }
}

export default function SalonsPage() {
  const [salons, setSalons] = useState<SalonSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchSalons = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiService.get<SalonsResponse>('/api/auth/admin/salons')
        if (!isMounted) return

        const list = response?.data ?? []
        setSalons(list)
      } catch (err: any) {
        if (!isMounted) return
        const message = err?.message || 'Не удалось загрузить список салонов'
        setError(message)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSalons()

    return () => {
      isMounted = false
    }
  }, [])

  const summary = useMemo(() => {
    const total = salons.length
    const active = salons.filter((salon) => salon.isActive).length
    const inactive = salons.filter((salon) => !salon.isActive).length

    return { total, active, inactive }
  }, [salons])

  const formatDate = (value: string) => {
    try {
      return new Date(value).toLocaleDateString('ru-RU')
    } catch (e) {
      return value
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Салоны красоты</h2>
          <p className="text-muted-foreground">
            Управление салонами в системе Beauty Platform
          </p>
        </div>
        <Button className="beauty-transition" disabled>
          <Plus className="w-4 h-4 mr-2" />
          Добавить салон
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card className="beauty-card">
          <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Загрузка списка салонов…</span>
          </CardContent>
        </Card>
      ) : salons.length === 0 ? (
        <Card className="beauty-card">
          <CardContent className="py-16 text-center text-muted-foreground">
            Салоны пока не зарегистрированы
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {salons.map((salon) => {
            const statusInfo = statusStyles[salon.status] ?? statusStyles.ACTIVE

            return (
              <Card key={salon.id} className="beauty-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{salon.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {salon.city || 'Город не указан'}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {salon.address || 'Адрес не указан'}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                        <span>{salon.staffCount} пользователей</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                        <span>{salon.clientsCount} клиентов</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <span className="text-sm font-medium">{statusInfo.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(salon.createdAt)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Язык: {salon.language}</div>
                    <div>Часовой пояс: {salon.timezone}</div>
                    <div>Валюта: {salon.currency}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="beauty-card">
        <CardHeader>
          <CardTitle>Статистика салонов</CardTitle>
          <CardDescription>
            Данные автоматически собираются из основной базы (порт 6100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{summary.total}</div>
              <div className="text-sm text-muted-foreground">Всего салонов</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">{summary.active}</div>
              <div className="text-sm text-muted-foreground">Активных</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-muted-foreground">{summary.inactive}</div>
              <div className="text-sm text-muted-foreground">Неактивных</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
