import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Download, Filter, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

export default function PaymentsPage() {
  const demoPayments = [
    {
      id: '1',
      clientName: 'Анна Иванова',
      amount: 28,
      service: 'Маникюр классический',
      date: '2025-08-15',
      time: '10:30',
      method: 'Карта',
      status: 'Завершен',
    },
    {
      id: '2',
      clientName: 'Елена Петрова',
      amount: 33,
      service: 'Стрижка женская',
      date: '2025-08-15',
      time: '14:00',
      method: 'Наличные',
      status: 'Завершен',
    },
    {
      id: '3',
      clientName: 'Мария Сидорова',
      amount: 89,
      service: 'Окрашивание волос',
      date: '2025-08-14',
      time: '11:00',
      method: 'Карта',
      status: 'Ожидает',
    },
  ];

  const totalToday = demoPayments
    .filter(p => p.date === '2025-08-15')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Платежи</h1>
            <p className="text-gray-600 mt-1">Финансовые операции салона</p>
          </div>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Экспорт отчета
          </Button>
        </div>

        {/* Быстрая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Сегодня
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">
                €{totalToday.toLocaleString()}
              </div>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                За неделю
              </CardTitle>
              <div className="text-2xl font-bold text-blue-600">€539</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                За месяц
              </CardTitle>
              <div className="text-2xl font-bold text-purple-600">€2,081</div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Средний чек
              </CardTitle>
              <div className="text-2xl font-bold text-amber-600">€47</div>
            </CardHeader>
          </Card>
        </div>

        {/* Фильтры */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option>Все периоды</option>
                  <option>Сегодня</option>
                  <option>Неделя</option>
                  <option>Месяц</option>
                </select>
                <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <option>Все методы</option>
                  <option>Карта</option>
                  <option>Наличные</option>
                  <option>Перевод</option>
                </select>
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Фильтры
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Список платежей */}
        <Card>
          <CardHeader>
            <CardTitle>Последние операции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Клиент</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Услуга</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Сумма</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Способ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Дата</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {demoPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{payment.clientName}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{payment.service}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-green-600">
                          €{payment.amount}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          {payment.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {payment.date} {payment.time}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          payment.status === 'Завершен' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}