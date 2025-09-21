import { useState, useMemo } from 'react';
import { Card, CardContent, Button } from '@beauty-platform/ui';
import { Plus, Calendar, Clock, User, Search, Eye, Edit, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../contexts/AuthContext';

export default function AppointmentsPage() {
  const { salonId, token } = useTenant();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Стабилизируем массив статусов через useMemo
  // Это предотвращает бесконечные циклы useEffect в useAppointments
  const filterStatuses = useMemo(() => 
    statusFilter === 'all' ? ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] : [statusFilter as any],
    [statusFilter]
  );
  
  // Стабилизируем объект фильтров через useMemo
  // Без этого React будет считать объект новым при каждом рендере
  const appointmentFilters = useMemo(() => ({
    staffIds: [] as string[],
    statuses: filterStatuses
  }), [filterStatuses]);

  // Стабилизируем дату через useMemo
  // Убираем фильтр по дате по умолчанию - показываем все записи
  const appointmentDate = useMemo(() => 
    dateFilter ? new Date(dateFilter) : undefined,
    [dateFilter]
  );

  const { appointments, loading, error, refresh } = useAppointments({
    date: appointmentDate,
    view: 'month',
    filters: appointmentFilters,
    salonId: salonId || undefined,
    token: token || undefined
  });

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredAppointments = appointments?.filter(appointment => {
    const matchesSearch = !searchQuery || 
      appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.serviceNames.some(service => service.toLowerCase().includes(searchQuery.toLowerCase())) ||
      appointment.staffName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'CANCELED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает';
      case 'CONFIRMED':
        return 'Подтверждена';
      case 'IN_PROGRESS':
        return 'Выполняется';
      case 'COMPLETED':
        return 'Завершена';
      case 'CANCELED':
        return 'Отменена';
      default:
        return status;
    }
  };

  const handleViewAppointment = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}`);
  };

  const handleEditAppointment = (appointmentId: string) => {
    navigate(`/appointments/${appointmentId}/edit`);
  };

  const openNewAppointment = () => {
    navigate('/appointments/new');
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Записи</h1>
            <p className="text-gray-600 mt-1">Управление записями салона ({filteredAppointments.length} записей)</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={refresh} 
              variant="outline"
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Обновить
            </Button>
            <Button onClick={openNewAppointment} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Новая запись
            </Button>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
              {/* Поиск */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск по клиенту, услуге или мастеру..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Фильтр по дате */}
              <div className="w-full lg:w-48">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Фильтр по статусу */}
              <div className="w-full lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Все статусы</option>
                  <option value="PENDING">Ожидает</option>
                  <option value="CONFIRMED">Подтверждена</option>
                  <option value="IN_PROGRESS">Выполняется</option>
                  <option value="COMPLETED">Завершена</option>
                  <option value="CANCELED">Отменена</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Состояния загрузки и ошибки */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Загрузка записей...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refresh} variant="outline">
                Попробовать снова
              </Button>
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!loading && !error && filteredAppointments.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 rounded-full p-8 mb-4 mx-auto w-32 h-32 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Записи не найдены' : 'Нет записей'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `По запросу "${searchQuery}" ничего не найдено` 
                  : 'Создайте первую запись для начала работы'
                }
              </p>
              {!searchQuery && (
                <Button onClick={openNewAppointment} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Создать запись
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Список записей */}
        {!loading && !error && filteredAppointments.length > 0 && (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Основная информация */}
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {appointment.clientName}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(appointment.status)}`}>
                              {getStatusLabel(appointment.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateTime(appointment.startAt)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{appointment.staffName}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / (1000 * 60))} мин
                              </span>
                            </div>
                          </div>

                          {/* Услуги */}
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                              {appointment.serviceNames.map((service, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Заметки */}
                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                              {appointment.notes}
                            </div>
                          )}
                        </div>
                        
                        {/* Цена */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {new Intl.NumberFormat('pl-PL', {
                              style: 'currency',
                              currency: appointment.currency || 'PLN'
                            }).format(Number(appointment.price) || 0)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Действия */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewAppointment(appointment.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditAppointment(appointment.id)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Изменить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}