import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Calendar, User, Briefcase, Save, Loader2, CheckCircle, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CRMApiService } from '../services/crmApiNew';
import type { CreateAppointmentData } from '../types/calendar';
import { useToast } from '../contexts/ToastContext';
import { useTenant } from '../contexts/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { type Service } from '../hooks/useServices';
import { StaffCard } from '../components/StaffCard';
import { AppointmentSummary } from '../components/AppointmentSummary';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface AppointmentFormState {
  clientId: string;
  serviceIds: string[];
  staffIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELED';
  notes: string;
}

// Цветная система статусов как в старом проекте
const statusOptions = [
  { 
    value: 'PENDING', 
    label: 'Oczekująca', 
    shortLabel: 'Oczek.', 
    color: 'bg-yellow-500 hover:bg-yellow-600', 
    colorLight: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: Timer 
  },
  { 
    value: 'CONFIRMED', 
    label: 'Potwierdzona', 
    shortLabel: 'Potw.', 
    color: 'bg-blue-500 hover:bg-blue-600', 
    colorLight: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: CheckCircle2 
  },
  { 
    value: 'COMPLETED', 
    label: 'Zakończona', 
    shortLabel: 'Zak.', 
    color: 'bg-green-500 hover:bg-green-600', 
    colorLight: 'bg-green-50 border-green-200 text-green-800',
    icon: CheckCircle 
  },
  { 
    value: 'CANCELED', 
    label: 'Anulowana', 
    shortLabel: 'Anul.', 
    color: 'bg-red-500 hover:bg-red-600', 
    colorLight: 'bg-red-50 border-red-200 text-red-800',
    icon: XCircle 
  }
];

// Функция для получения цветов статуса
const getStatusStyles = (status: string) => {
  const statusOption = statusOptions.find(opt => opt.value === status);
  return statusOption || statusOptions[0]; // fallback на PENDING
};

export default function AppointmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  
  // Удобные функции для уведомлений
  const success = (title: string, description?: string) => 
    showToast({ title, description, variant: 'success' });
  const showError = (title: string, description?: string) => 
    showToast({ title, description, variant: 'destructive' });
  const { /* tenantId */ } = useTenant(); // tenantId не используется в текущей реализации
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Используем тот же hook что и календарь для мастеров
  const { staff: staffData, loading: staffLoading } = useStaff();
  
  // Преобразуем данные мастеров под формат формы
  const staff = staffData.map(member => ({
    id: member.id,
    name: `${member.firstName} ${member.lastName}`,
    role: member.role,
    active: member.status === 'ACTIVE',
    color: member.color
  }));
  
  const isEdit = !!id;
  const pageTitle = isEdit ? 'Редактировать запись' : 'Новая запись';

  // Pre-fill form with URL parameters
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const rawInitialTime = searchParams.get('time') || '09:00';
  
  // Функция для округления времени до 15-минутных интервалов (должна быть определена до useState)
  const roundTimeToQuarterHourTemp = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    if (roundedMinutes === 60) {
      return `${String(hours + 1).padStart(2, '0')}:00`;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
  };
  
  const initialTime = roundTimeToQuarterHourTemp(rawInitialTime);

  const [formData, setFormData] = useState<AppointmentFormState>({
    clientId: '',
    serviceIds: [],
    staffIds: [],
    date: initialDate,
    startTime: initialTime,
    endTime: initialTime, // Will be calculated when service is selected
    status: 'CONFIRMED',
    notes: ''
  });

  useEffect(() => {
    loadFormData();
    if (isEdit) {
      loadAppointment();
    }
  }, [id]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      // Загружаем только клиентов и услуги, мастера берем из useStaff hook
      const [clientsRes, servicesRes] = await Promise.all([
        CRMApiService.getClients(),
        CRMApiService.getServices()
      ]);

      if (clientsRes.success) setClients(clientsRes.clients);
      if (servicesRes.success) setServices(servicesRes.services);
      
      console.log('✅ [AppointmentForm] Form data loaded:', {
        clients: clientsRes.clients?.length || 0,
        services: servicesRes.services?.length || 0,
        staff: staff.length
      });
      
      // ОТЛАДКА: Посмотрим что реально в услугах
      console.log('🔍 [DEBUG] First service data:', servicesRes.services?.[0]);
    } catch (err) {
      console.error('Failed to load form data:', err);
      showError('Не удалось загрузить данные формы');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointment = async () => {
    if (!id) return;
    
    try {
      // TODO: Load existing appointment data
      // This will need to be implemented when we have the appointment details API
    } catch (err) {
      console.error('Failed to load appointment:', err);
      showError('Не удалось загрузить данные записи');
    }
  };

  // Функция для округления времени до 15-минутных интервалов
  const roundTimeToQuarterHour = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    if (roundedMinutes === 60) {
      return `${String(hours + 1).padStart(2, '0')}:00`;
    }
    
    return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
  };

  // Обработчик изменения времени с автоматическим округлением
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const roundedTime = roundTimeToQuarterHour(value);
    setFormData(prev => ({ ...prev, [field]: roundedTime }));
    
    // Если изменили startTime, пересчитываем endTime
    if (field === 'startTime' && formData.serviceIds.length > 0) {
      const totalDuration = formData.serviceIds.reduce((total, id) => {
        const service = services.find(s => s.id === id);
        return total + (service?.duration || 0);
      }, 0);
      
      const startDateTime = new Date(`${formData.date}T${roundedTime}:00`);
      startDateTime.setMinutes(startDateTime.getMinutes() + totalDuration);
      
      setFormData(prev => ({
        ...prev,
        startTime: roundedTime,
        endTime: startDateTime.toTimeString().slice(0, 5)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isEdit) {
        // TODO: Update appointment
        showError('Редактирование записей пока не реализовано');
      } else {
        // Create new appointment
        // const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
        // const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
        // Переменные startDateTime и endDateTime не используются в текущей API

        const appointmentData: CreateAppointmentData = {
          clientId: formData.clientId,
          serviceIds: formData.serviceIds,
          staffId: formData.staffIds[0],
          startAt: `${formData.date}T${formData.startTime}:00`,
          endAt: `${formData.date}T${formData.endTime}:00`,
          status: formData.status,
          notes: formData.notes || undefined,
        };

        const result = await CRMApiService.createAppointment(appointmentData);
        
        if (result.success) {
          success('Запись успешно создана');
          navigate('/appointments');
        } else {
          showError('Не удалось создать запись');
        }
      }
    } catch (err) {
      console.error('Failed to save appointment:', err);
      showError('Не удалось сохранить запись');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.clientId) {
      showError('Выберите клиента');
      return false;
    }
    if (formData.serviceIds.length === 0) {
      showError('Выберите хотя бы одну услугу');
      return false;
    }
    if (formData.staffIds.length === 0) {
      showError('Выберите мастера');
      return false;
    }
    if (!formData.date || !formData.startTime) {
      showError('Укажите дату и время');
      return false;
    }
    return true;
  };

  const handleServiceChange = (serviceId: string) => {
    const isSelected = formData.serviceIds.includes(serviceId);
    const newServiceIds = isSelected
      ? formData.serviceIds.filter(id => id !== serviceId)
      : [...formData.serviceIds, serviceId];
    
    setFormData(prev => ({ ...prev, serviceIds: newServiceIds }));
    
    // Auto-calculate end time
    if (newServiceIds.length > 0) {
      const totalDuration = newServiceIds.reduce((total, id) => {
        const service = services.find(s => s.id === id);
        return total + (service?.duration || 0);
      }, 0);
      
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
      startDateTime.setMinutes(startDateTime.getMinutes() + totalDuration);
      
      // Округляем endTime до 15 минут
      const endTime = startDateTime.toTimeString().slice(0, 5);
      const roundedEndTime = roundTimeToQuarterHour(endTime);
      
      setFormData(prev => ({
        ...prev,
        endTime: roundedEndTime
      }));
    }
  };

  const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  if (loading || staffLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2 text-gray-600">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="w-full px-6 py-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/appointments')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full">
            {/* Left Column - Client Selection - 4/12 ширины */}
            <div className="xl:col-span-4 space-y-6">
              {/* Client Selection */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-6 h-6 mr-3" />
                    Клиент *
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Выберите клиента</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.phone && `(${client.phone})`}
                      </option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Services & Staff - 5/12 ширины */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Service Selection */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Briefcase className="w-6 h-6 mr-3" />
                    Услуги *
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {services.map(service => (
                      <label key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.serviceIds.includes(service.id)}
                          onChange={() => handleServiceChange(service.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {service.name || 'Название услуги'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {service.duration || 0} мин • {service.price || 0} PLN
                          </div>
                          {/* DEBUG: Покажем что реально в объекте */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-red-500">
                              DEBUG: name={service.name}, duration={service.duration}, price={service.price}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Selection - КРАСИВЫЕ КАРТОЧКИ КАК В СТАРОМ ПРОЕКТЕ! */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <User className="w-6 h-6 mr-3" />
                    Мастер *
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {staff.length > 0 ? (
                      staff.map(member => (
                        <StaffCard
                          key={member.id}
                          staff={member}
                          selected={formData.staffIds.includes(member.id)}
                          onClick={() => {
                            // Заменяем выбранного мастера (не добавляем, а заменяем)
                            setFormData(prev => ({ 
                              ...prev, 
                              staffIds: [member.id] 
                            }));
                          }}
                          className="w-24"
                        />
                      ))
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        Мастера не найдены
                      </div>
                    )}
                  </div>
                  {formData.staffIds.length === 0 && (
                    <div className="text-red-500 text-sm mt-2">
                      Выберите мастера для записи
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Time, Status & LIVE SUMMARY - 3/12 ширины */}
            <div className="xl:col-span-3 space-y-6">

              {/* Date & Time */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="w-6 h-6 mr-3" />
                    Дата и время *
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
                      <input
                        type="time"
                        step="900"
                        value={formData.startTime}
                        onChange={(e) => handleTimeChange('startTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        placeholder="HH:MM"
                        pattern="[0-9]{2}:[0-9]{2}"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Автоматически округляется до 15 минут (00, 15, 30, 45)
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Конец</label>
                      <input
                        type="time"
                        step="900"
                        value={formData.endTime}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Рассчитывается автоматически
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status - ЦВЕТНЫЕ КНОПКИ КАК В СТАРОМ ПРОЕКТЕ */}
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Статус записи</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((statusOption) => {
                      const Icon = statusOption.icon;
                      const isSelected = formData.status === statusOption.value;
                      
                      return (
                        <button
                          key={statusOption.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, status: statusOption.value as any }))}
                          className={`
                            relative p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                            ${isSelected 
                              ? `${statusOption.colorLight} border-current shadow-lg` 
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:block">{statusOption.label}</span>
                            <span className="block sm:hidden">{statusOption.shortLabel}</span>
                          </div>
                          
                          {/* Индикатор выбранного статуса */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-current rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Текущий выбранный статус */}
                  <div className="mt-3 text-center">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(formData.status).colorLight}`}>
                      {React.createElement(getStatusStyles(formData.status).icon, { className: "w-4 h-4" })}
                      <span>Выбран: {getStatusStyles(formData.status).label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ЖИВАЯ СВОДКА КАК В СТАРОМ ПРОЕКТЕ! */}
              <AppointmentSummary
                selectedClient={clients.find(c => c.id === formData.clientId)}
                selectedServices={selectedServices}
                selectedStaff={staff.find(s => s.id === formData.staffIds[0])}
                date={formData.date}
                startTime={formData.startTime}
                endTime={formData.endTime}
                totalPrice={totalPrice}
                totalDuration={totalDuration}
                status={formData.status}
              />
            </div>
          </div>

          {/* Notes */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Заметки</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Дополнительная информация о записи..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/appointments')}
            >
              Отменить
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? 'Сохранить изменения' : 'Создать запись'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
