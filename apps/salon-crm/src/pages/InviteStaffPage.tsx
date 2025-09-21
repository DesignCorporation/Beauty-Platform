import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { ArrowLeft, UserPlus, Mail, Phone, User, MessageSquare, Shield, CheckCircle, Send } from 'lucide-react';

const roles = [
  { value: 'STAFF_MEMBER', label: 'Мастер', description: 'Основная роль для оказания услуг', color: 'text-green-600' },
  { value: 'MANAGER', label: 'Менеджер', description: 'Управление операциями салона', color: 'text-blue-600' },
  { value: 'RECEPTIONIST', label: 'Администратор', description: 'Работа с клиентами и записями', color: 'text-orange-600' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер', description: 'Финансовый учет', color: 'text-gray-600' }
];

const defaultPermissions = {
  STAFF_MEMBER: ['calendar.view', 'appointments.manage'],
  MANAGER: ['calendar.view', 'calendar.edit', 'appointments.view', 'appointments.manage', 'clients.view', 'services.view'],
  RECEPTIONIST: ['calendar.view', 'appointments.view', 'appointments.manage', 'clients.view', 'clients.manage'],
  ACCOUNTANT: ['appointments.view', 'clients.view', 'finances.view']
};

const permissionLabels: Record<string, string> = {
  'calendar.view': 'Просмотр календаря',
  'calendar.edit': 'Редактирование календаря',
  'appointments.view': 'Просмотр записей',
  'appointments.manage': 'Управление записями',
  'clients.view': 'Просмотр клиентов',
  'clients.manage': 'Управление клиентами',
  'services.view': 'Просмотр услуг',
  'finances.view': 'Просмотр финансов'
};

export default function InviteStaffPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    masterName: '',
    masterEmail: '',
    masterPhone: '',
    role: 'STAFF_MEMBER',
    personalMessage: 'Приглашаю работать в нашем салоне! У нас дружный коллектив и постоянный поток клиентов.'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const invitationData = {
        ...formData,
        permissions: defaultPermissions[formData.role as keyof typeof defaultPermissions],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
      };

      console.log('Отправка приглашения:', invitationData);

      // Симулируем успешную отправку на время разработки
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const response = await fetch('/api/invitations', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   credentials: 'include',
      //   body: JSON.stringify(invitationData)
      // });

      // const data = await response.json();

      // if (!response.ok) {
      //   throw new Error(data.message || `HTTP ${response.status}`);
      // }

      // Симулируем успех
      setSuccess(true);
      
    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке приглашения');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.value === formData.role);

  if (success) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-900">
                Приглашение отправлено! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-green-800">
                Мастер <strong>{formData.masterName}</strong> получит email-приглашение на адрес:
              </p>
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <div className="font-mono text-sm text-green-900">
                  {formData.masterEmail}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Что дальше?</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• Мастер получит email с приглашением и ссылкой</div>
                  <div>• Срок действия приглашения: 7 дней</div>
                  <div>• После принятия приглашения мастер появится в разделе "Команда"</div>
                  <div>• Вы можете отслеживать статус приглашений в настройках</div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/team')}
                  className="flex-1"
                >
                  К списку команды
                </Button>
                <Button 
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      masterName: '',
                      masterEmail: '',
                      masterPhone: '',
                      role: 'STAFF_MEMBER',
                      personalMessage: 'Приглашаю работать в нашем салоне! У нас дружный коллектив и постоянный поток клиентов.'
                    });
                  }}
                  className="flex-1"
                >
                  Пригласить еще
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок с кнопкой назад */}
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/team')}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-purple-600" />
              Пригласить мастера
            </h1>
            <p className="text-gray-600 mt-1">Отправьте приглашение для работы в салоне</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма приглашения */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Данные мастера</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Имя мастера */}
                    <div>
                      <Label htmlFor="masterName" className="text-sm font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Имя мастера *
                      </Label>
                      <Input
                        id="masterName"
                        name="masterName"
                        type="text"
                        value={formData.masterName}
                        onChange={handleInputChange}
                        placeholder="Анна Мастерова"
                        required
                        disabled={loading}
                        className="mt-1"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="masterEmail" className="text-sm font-medium flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email *
                      </Label>
                      <Input
                        id="masterEmail"
                        name="masterEmail"
                        type="email"
                        value={formData.masterEmail}
                        onChange={handleInputChange}
                        placeholder="anna@example.com"
                        required
                        disabled={loading}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Телефон */}
                    <div>
                      <Label htmlFor="masterPhone" className="text-sm font-medium flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Телефон
                      </Label>
                      <Input
                        id="masterPhone"
                        name="masterPhone"
                        type="tel"
                        value={formData.masterPhone}
                        onChange={handleInputChange}
                        placeholder="+48 123 456 789"
                        disabled={loading}
                        className="mt-1"
                      />
                    </div>

                    {/* Роль */}
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Роль в салоне *
                      </Label>
                      <Select value={formData.role} onValueChange={handleRoleChange} disabled={loading}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className={`font-medium ${role.color}`}>{role.label}</div>
                                <div className="text-xs text-gray-500">{role.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Личное сообщение */}
                  <div>
                    <Label htmlFor="personalMessage" className="text-sm font-medium flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Личное сообщение
                    </Label>
                    <textarea
                      id="personalMessage"
                      name="personalMessage"
                      value={formData.personalMessage}
                      onChange={handleInputChange}
                      placeholder="Добавьте личное сообщение для приглашения..."
                      disabled={loading}
                      className="mt-1 min-h-[120px] flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Это сообщение будет включено в email приглашение
                    </p>
                  </div>

                  {/* Кнопка отправки */}
                  <Button
                    type="submit"
                    disabled={loading || !formData.masterName || !formData.masterEmail}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Отправляем приглашение...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Отправить приглашение
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar с информацией */}
          <div className="space-y-6">
            {/* Права доступа для выбранной роли */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Права доступа
                </CardTitle>
                {selectedRole && (
                  <p className={`text-sm ${selectedRole.color}`}>
                    Роль: {selectedRole.label}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultPermissions[formData.role as keyof typeof defaultPermissions].map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center text-sm bg-blue-50 text-blue-800 px-3 py-2 rounded-lg"
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                      {permissionLabels[permission] || permission}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Информация о системе приглашений */}
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg text-purple-900">
                  🚀 Система приглашений
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-purple-800 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>Мастер получит email с приглашением и сможет присоединиться к вашему салону</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>Если у него уже есть аккаунт, он сможет работать в нескольких салонах</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>Приглашение действует 7 дней</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                  <div>Мастер работает бесплатно (оплачивает салон)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}