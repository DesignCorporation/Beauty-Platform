import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Plus, Search, Phone, Mail, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useAuthContext } from '../contexts/AuthContext';

export default function ClientsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { clients, loading, error, createClient, deleteClient, searchClients } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(clients);

  // Обновляем результаты поиска при изменении клиентов
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(clients);
    }
  }, [clients, searchQuery]);

  // Обработка поиска
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchClients(query);
      setSearchResults(results);
    } else {
      setSearchResults(clients);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не записан';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const displayClients = searchQuery ? searchResults : clients;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
            <p className="text-gray-600 mt-1">База клиентов салона ({clients.length} клиентов)</p>
          </div>
          <Button onClick={() => navigate('/clients/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить клиента
          </Button>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск клиентов по имени, email или телефону..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline">
                Фильтры
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Состояния загрузки и ошибки */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-600">Загрузка клиентов...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Попробовать снова
              </Button>
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {!loading && !error && displayClients.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 rounded-full p-8 mb-4 mx-auto w-32 h-32 flex items-center justify-center">
                <Phone className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Клиенты не найдены' : 'Нет клиентов'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `По запросу "${searchQuery}" ничего не найдено` 
                  : 'Добавьте первого клиента для начала работы'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/clients/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить клиента
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Список клиентов */}
        {!loading && !error && displayClients.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      <div className="flex flex-col mt-2 space-y-1 text-sm text-gray-600">
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {client.phone}
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                        Редактировать
                      </Button>
                      <div className={`px-2 py-1 text-xs rounded-full text-center ${
                        client.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status === 'ACTIVE' ? 'Активен' : 'Неактивен'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center mb-4">
                    <div>
                      <div className="text-lg font-bold text-gray-600">
                        {formatDate(client.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">Дата регистрации</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">0</div>
                      <div className="text-xs text-gray-500">Визитов</div>
                    </div>
                  </div>
                  
                  {client.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{client.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Записать
                    </Button>
                    {client.phone && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Позвонить
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Все клиенты отображены */}
      </div>
    </div>
  );
}