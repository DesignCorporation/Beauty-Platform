import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Plus, Search, Edit3, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
import { useServices } from '../hooks/useServices';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { services, loading, error, searchServices, deleteService } = useServices();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(services);
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  
  // Функция фильтрации услуг
  const applyFilters = (servicesList: typeof services) => {
    let filtered = [...servicesList];
    
    // Фильтр по цене
    if (priceFilter !== 'all') {
      filtered = filtered.filter(service => {
        const price = Number(service.price);
        switch (priceFilter) {
          case 'low': return price < 50;
          case 'medium': return price >= 50 && price <= 150;
          case 'high': return price > 150;
          default: return true;
        }
      });
    }
    
    // Фильтр по длительности
    if (durationFilter !== 'all') {
      filtered = filtered.filter(service => {
        const duration = service.duration;
        switch (durationFilter) {
          case 'short': return duration <= 30;
          case 'medium': return duration > 30 && duration <= 90;
          case 'long': return duration > 90;
          default: return true;
        }
      });
    }
    
    return filtered;
  };

  // Обновляем результаты при изменении услуг или фильтров
  useEffect(() => {
    let baseServices = services;
    
    // Если есть поиск, сначала выполняем поиск асинхронно
    if (searchQuery.trim()) {
      searchServices(searchQuery).then(searchResults => {
        const filteredResults = applyFilters(searchResults);
        setSearchResults(filteredResults);
      });
    } else {
      // Если поиска нет, применяем фильтры к всем услугам
      const filteredServices = applyFilters(baseServices);
      setSearchResults(filteredServices);
    }
  }, [services, priceFilter, durationFilter]);

  // Отдельный useEffect для поиска
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Если поиск очищен, показываем все услуги с фильтрами
      const filteredServices = applyFilters(services);
      setSearchResults(filteredServices);
    }
  }, [searchQuery, services]);

  // Обработка поиска
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = await searchServices(query);
      setSearchResults(results);
    } else {
      setSearchResults(services);
    }
  };

  // Обработка удаления услуги
  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить услугу "${serviceName}"?`)) {
      try {
        await deleteService(serviceId);
        // Обновляем результаты поиска после удаления
        if (searchQuery) {
          handleSearch(searchQuery);
        }
      } catch (error) {
        console.error('Ошибка при удалении услуги:', error);
        alert('Ошибка при удалении услуги');
      }
    }
  };

  const displayServices = searchQuery ? searchResults : services;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Услуги</h1>
            <p className="text-gray-600 mt-1">Управление услугами салона</p>
          </div>
          <Button onClick={() => navigate('/services/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить услугу
          </Button>
        </div>

        {/* Поиск и фильтры */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Поиск услуг..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
              >
                Фильтры {(priceFilter !== 'all' || durationFilter !== 'all') && '•'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Панель фильтров */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Фильтр по цене */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Цена
                  </label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Все цены</option>
                    <option value="low">До 50 ₴</option>
                    <option value="medium">50-150 ₴</option>
                    <option value="high">Свыше 150 ₴</option>
                  </select>
                </div>

                {/* Фильтр по длительности */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Длительность
                  </label>
                  <select
                    value={durationFilter}
                    onChange={(e) => setDurationFilter(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Любая длительность</option>
                    <option value="short">До 30 мин</option>
                    <option value="medium">30-90 мин</option>
                    <option value="long">Свыше 90 мин</option>
                  </select>
                </div>
              </div>

              {/* Кнопка сброса фильтров */}
              {(priceFilter !== 'all' || durationFilter !== 'all') && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPriceFilter('all');
                      setDurationFilter('all');
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Список услуг */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка услуг...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">❌ Ошибка загрузки услуг: {error}</p>
            <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Услуги не найдены</p>
            <Button onClick={() => navigate('/services/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую услугу
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/services/${service.id}/edit`)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(service.id, service.name)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Длительность:</span>
                      <span className="text-sm font-medium">{service.duration} мин</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Стоимость:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatPrice(Number(service.price))}
                      </span>
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