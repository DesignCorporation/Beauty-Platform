import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Download, TrendingUp, TrendingDown, Users, Calendar, DollarSign } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
            <p className="text-gray-600 mt-1">Отчеты и статистика салона</p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Экспорт отчета
          </Button>
        </div>

        {/* Ключевые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Выручка за месяц
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">€2,081</div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12.5%
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Записей за месяц
              </CardTitle>
              <div className="text-2xl font-bold text-blue-600">234</div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8.2%
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Новых клиентов
              </CardTitle>
              <div className="text-2xl font-bold text-purple-600">18</div>
              <div className="flex items-center text-sm text-red-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                -3.1%
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Средний чек
              </CardTitle>
              <div className="text-2xl font-bold text-amber-600">€47</div>
              <div className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                +5.7%
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Графики и диаграммы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* График выручки */}
          <Card>
            <CardHeader>
              <CardTitle>Выручка по дням</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">График выручки (в разработке)</p>
              </div>
            </CardContent>
          </Card>

          {/* Популярные услуги */}
          <Card>
            <CardHeader>
              <CardTitle>Популярные услуги</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Маникюр', count: 45, percentage: 35 },
                  { name: 'Стрижка', count: 32, percentage: 25 },
                  { name: 'Окрашивание', count: 28, percentage: 22 },
                  { name: 'Педикюр', count: 23, percentage: 18 },
                ].map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-sm text-gray-600">{service.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${service.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Загрузка мастеров */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Загрузка мастеров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Мария Косметолог', workload: 87, revenue: 500, appointments: 23 },
                { name: 'Ольга Мастер', workload: 72, revenue: 422, appointments: 19 },
                { name: 'Анна Педикюр', workload: 65, revenue: 356, appointments: 16 },
              ].map((master, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">{master.name}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Загрузка</span>
                        <span>{master.workload}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${master.workload}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Выручка:</span>
                      <span className="font-medium">€{master.revenue}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Записей:</span>
                      <span className="font-medium">{master.appointments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Периоды сравнения */}
        <Card>
          <CardHeader>
            <CardTitle>Сравнение периодов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Этот месяц</div>
                <div className="text-sm text-gray-600 mt-1">€2,081 • 234 записи</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">Прошлый месяц</div>
                <div className="text-sm text-gray-600 mt-1">€1,853 • 216 записей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">Рост</div>
                <div className="text-sm text-green-600 mt-1">+€228 • +18 записей</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}