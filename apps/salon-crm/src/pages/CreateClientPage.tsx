import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Save, Loader2, User, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClients } from '../hooks/useClients';

export default function CreateClientPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createClient } = useClients();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    birthday: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createClient({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
        birthday: formData.birthday || undefined
      });
      
      navigate('/clients');
    } catch (error) {
      console.error('Ошибка при создании клиента:', error);
      alert('Ошибка при создании клиента');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name.trim() !== '';

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок и навигация */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к клиентам
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Добавить клиента</h1>
              <p className="text-gray-600 mt-1">Создание профиля нового клиента</p>
            </div>
          </div>
        </div>

        {/* Форма создания клиента */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Информация о клиенте
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Основная информация */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Основная информация</h3>
                
                {/* Имя */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Полное имя *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Например: Иванова Анна Сергеевна"
                  />
                </div>

                {/* Email и телефон */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="anna@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Телефон
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                </div>

                {/* День рождения */}
                <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    День рождения
                  </label>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Дополнительная информация</h3>
                
                {/* Заметки */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Заметки
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Предпочтения, аллергии, особые пожелания..."
                  />
                </div>
              </div>

              {/* Предпросмотр */}
              {isFormValid && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Предпросмотр:</h3>
                  <div className="bg-white p-4 rounded border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          {formData.email && (
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {formData.email}
                            </div>
                          )}
                          {formData.phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {formData.phone}
                            </div>
                          )}
                          {formData.birthday && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(formData.birthday).toLocaleDateString('ru-RU')}
                            </div>
                          )}
                        </div>
                        {formData.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <strong>Заметки:</strong> {formData.notes}
                          </div>
                        )}
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
                  onClick={() => navigate('/clients')}
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
                      Создание...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Создать клиента
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