import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui'
import { Calendar, Clock, MapPin, Star, User, LogOut } from 'lucide-react'
import { clientApi } from '../services'

interface DashboardPageProps {
  onLogout?: () => void
}

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const { t } = useTranslation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await clientApi.logoutClient()
      onLogout?.() // Вызываем callback для обновления состояния в App
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const upcomingBookings = [
    {
      id: 1,
      salon: 'Beauty Salon Deluxe',
      service: 'Стрижка + укладка',
      master: 'Анна Иванова',
      date: '2025-08-18',
      time: '14:00',
      price: '150 zł',
      status: 'confirmed'
    },
    {
      id: 2,
      salon: 'Nails Studio',
      service: 'Маникюр гель-лак',
      master: 'Мария Ковальская',
      date: '2025-08-22',
      time: '16:30',
      price: '80 zł',
      status: 'pending'
    }
  ]

  const favoritesSalons = [
    {
      id: 1,
      name: 'Beauty Salon Deluxe',
      rating: 4.8,
      address: 'ul. Krakowska 15, Warszawa',
      image: '/salon1.jpg'
    },
    {
      id: 2,
      name: 'Nails Studio',
      rating: 4.9,
      address: 'ul. Marszałkowska 42, Warszawa', 
      image: '/salon2.jpg'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Анна Клиент</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoggingOut ? 'Выход...' : 'Выйти'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  Добро пожаловать, Анна!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  У вас запланированы 2 посещения на ближайшие недели
                </p>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Записаться на новую процедуру
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Ближайшие записи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{booking.service}</h4>
                          <p className="text-gray-600">{booking.salon}</p>
                          <p className="text-sm text-gray-500">Мастер: {booking.master}</p>
                          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {booking.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {booking.time}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{booking.price}</div>
                          <div className={`text-sm px-2 py-1 rounded mt-1 ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status === 'confirmed' ? 'Подтверждено' : 'Ожидает подтверждения'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline">Изменить</Button>
                        <Button size="sm" variant="outline">Отменить</Button>
                        <Button size="sm">Направление</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking History */}
            <Card>
              <CardHeader>
                <CardTitle>История посещений</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Пока нет завершенных посещений</p>
                  <p className="text-sm">После первого визита здесь появится история</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Новая запись
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Star className="h-4 w-4 mr-2" />
                  Найти салон
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Рядом со мной
                </Button>
              </CardContent>
            </Card>

            {/* Favorite Salons */}
            <Card>
              <CardHeader>
                <CardTitle>Избранные салоны</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favoritesSalons.map((salon) => (
                    <div key={salon.id} className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                      <h4 className="font-medium text-gray-900">{salon.name}</h4>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{salon.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{salon.address}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Всего посещений:</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Любимая услуга:</span>
                    <span className="font-semibold">Маникюр</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Сэкономлено:</span>
                    <span className="font-semibold text-green-600">120 zł</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}