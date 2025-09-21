import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
import { useServices } from '../hooks/useServices';

export default function EditServicePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { services, updateService, loading: servicesLoading } = useServices();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: ''
  });

  // Найти услугу по ID и заполнить форму
  useEffect(() => {
    if (id && services.length > 0) {
      const service = services.find(s => s.id === id);
      if (service) {
        setFormData({
          name: service.name,
          description: service.description || '',
          duration: service.duration.toString(),
          price: service.price.toString()
        });
      }
    }
  }, [id, services]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);

    try {
      await updateService(id, {
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price)
      });
      
      navigate('/services');
    } catch (error) {
      console.error('Ошибка при обновлении услуги:', error);
      alert('Ошибка при обновлении услуги');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.duration && formData.price;
  const service = services.find(s => s.id === id);

  if (servicesLoading) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Загрузка услуги...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">❌ Услуга не найдена</p>
            <Button onClick={() => navigate('/services')}>Вернуться к услугам</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок и навигация */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/services')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к услугам
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Редактировать услугу</h1>
              <p className="text-gray-600 mt-1">Изменение информации об услуге</p>
            </div>
          </div>
        </div>

        {/* Форма редактирования услуги */}
        <Card>
          <CardHeader>
            <CardTitle>Информация об услуге</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Название услуги */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Название услуги *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Например: Стрижка женская"
                />
              </div>

              {/* Описание */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Краткое описание услуги..."
                />
              </div>

              {/* Длительность и цена */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Длительность (мин) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="60"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Цена *
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1500.00"
                  />
                </div>
              </div>

              {/* Предпросмотр */}
              {isFormValid && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Предпросмотр изменений:</h3>
                  <div className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                        {formData.description && (
                          <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Длительность:</span>
                        <span className="font-medium">{formData.duration} мин</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">Стоимость:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(Number(formData.price))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/services')}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}