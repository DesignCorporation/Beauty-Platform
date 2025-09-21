import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Calendar, User, Briefcase, Save, Loader2, CheckCircle, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CRMApiService } from '../services/crmApiNew';
import { useToast } from '../contexts/ToastContext';
import { useTenant } from '../contexts/AuthContext';
import { useStaff } from '../hooks/useStaff';
import { StaffCard } from '../components/StaffCard';
import { AppointmentSummary } from '../components/AppointmentSummary';
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
const getStatusStyles = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption || statusOptions[0]; // fallback на PENDING
};
export default function AppointmentFormPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    // Удобные функции для уведомлений
    const success = (title, description) => showToast({ title, description, variant: 'success' });
    const showError = (title, description) => showToast({ title, description, variant: 'destructive' });
    const {} = useTenant(); // tenantId не используется в текущей реализации
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
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
    const roundTimeToQuarterHourTemp = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const roundedMinutes = Math.round(minutes / 15) * 15;
        if (roundedMinutes === 60) {
            return `${String(hours + 1).padStart(2, '0')}:00`;
        }
        return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
    };
    const initialTime = roundTimeToQuarterHourTemp(rawInitialTime);
    const [formData, setFormData] = useState({
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
            if (clientsRes.success)
                setClients(clientsRes.clients);
            if (servicesRes.success)
                setServices(servicesRes.services);
            console.log('✅ [AppointmentForm] Form data loaded:', {
                clients: clientsRes.clients?.length || 0,
                services: servicesRes.services?.length || 0,
                staff: staff.length
            });
            // ОТЛАДКА: Посмотрим что реально в услугах
            console.log('🔍 [DEBUG] First service data:', servicesRes.services?.[0]);
        }
        catch (err) {
            console.error('Failed to load form data:', err);
            showError('Не удалось загрузить данные формы');
        }
        finally {
            setLoading(false);
        }
    };
    const loadAppointment = async () => {
        if (!id)
            return;
        try {
            // TODO: Load existing appointment data
            // This will need to be implemented when we have the appointment details API
        }
        catch (err) {
            console.error('Failed to load appointment:', err);
            showError('Не удалось загрузить данные записи');
        }
    };
    // Функция для округления времени до 15-минутных интервалов
    const roundTimeToQuarterHour = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        const roundedMinutes = Math.round(minutes / 15) * 15;
        if (roundedMinutes === 60) {
            return `${String(hours + 1).padStart(2, '0')}:00`;
        }
        return `${String(hours).padStart(2, '0')}:${String(roundedMinutes).padStart(2, '0')}`;
    };
    // Обработчик изменения времени с автоматическим округлением
    const handleTimeChange = (field, value) => {
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setSaving(true);
        try {
            if (isEdit) {
                // TODO: Update appointment
                showError('Редактирование записей пока не реализовано');
            }
            else {
                // Create new appointment
                // const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
                // const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
                // Переменные startDateTime и endDateTime не используются в текущей API
                const appointmentData = {
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
                }
                else {
                    showError('Не удалось создать запись');
                }
            }
        }
        catch (err) {
            console.error('Failed to save appointment:', err);
            showError('Не удалось сохранить запись');
        }
        finally {
            setSaving(false);
        }
    };
    const validateForm = () => {
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
    const handleServiceChange = (serviceId) => {
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
        return (_jsxs("div", { className: "flex items-center justify-center min-h-screen", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-500" }), _jsx("span", { className: "ml-2 text-gray-600", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..." })] }));
    }
    return (_jsx("div", { className: "w-full h-full", children: _jsxs("div", { className: "w-full px-6 py-4", children: [_jsxs("div", { className: "flex items-center space-x-4 mb-6", children: [_jsxs(Button, { variant: "outline", onClick: () => navigate('/appointments'), className: "flex items-center", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\u041D\u0430\u0437\u0430\u0434"] }), _jsx("h1", { className: "text-3xl font-bold text-gray-900", children: pageTitle })] }), _jsxs("form", { onSubmit: handleSubmit, className: "w-full space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-12 gap-8 w-full", children: [_jsx("div", { className: "xl:col-span-4 space-y-6", children: _jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs(CardTitle, { className: "flex items-center text-lg", children: [_jsx(User, { className: "w-6 h-6 mr-3" }), "\u041A\u043B\u0438\u0435\u043D\u0442 *"] }) }), _jsx(CardContent, { className: "pt-0", children: _jsxs("select", { value: formData.clientId, onChange: (e) => setFormData(prev => ({ ...prev, clientId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true, children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }), clients.map(client => (_jsxs("option", { value: client.id, children: [client.name, " ", client.phone && `(${client.phone})`] }, client.id)))] }) })] }) }), _jsxs("div", { className: "xl:col-span-5 space-y-6", children: [_jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs(CardTitle, { className: "flex items-center text-lg", children: [_jsx(Briefcase, { className: "w-6 h-6 mr-3" }), "\u0423\u0441\u043B\u0443\u0433\u0438 *"] }) }), _jsx(CardContent, { className: "pt-0", children: _jsx("div", { className: "space-y-2 max-h-60 overflow-y-auto", children: services.map(service => (_jsxs("label", { className: "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50", children: [_jsx("input", { type: "checkbox", checked: formData.serviceIds.includes(service.id), onChange: () => handleServiceChange(service.id), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium", children: service.name || 'Название услуги' }), _jsxs("div", { className: "text-sm text-gray-500", children: [service.duration || 0, " \u043C\u0438\u043D \u2022 ", service.price || 0, " PLN"] }), process.env.NODE_ENV === 'development' && (_jsxs("div", { className: "text-xs text-red-500", children: ["DEBUG: name=", service.name, ", duration=", service.duration, ", price=", service.price] }))] })] }, service.id))) }) })] }), _jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs(CardTitle, { className: "flex items-center text-lg", children: [_jsx(User, { className: "w-6 h-6 mr-3" }), "\u041C\u0430\u0441\u0442\u0435\u0440 *"] }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsx("div", { className: "flex gap-4 overflow-x-auto pb-4", children: staff.length > 0 ? (staff.map(member => (_jsx(StaffCard, { staff: member, selected: formData.staffIds.includes(member.id), onClick: () => {
                                                                    // Заменяем выбранного мастера (не добавляем, а заменяем)
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        staffIds: [member.id]
                                                                    }));
                                                                }, className: "w-24" }, member.id)))) : (_jsx("div", { className: "text-gray-500 text-center py-8", children: "\u041C\u0430\u0441\u0442\u0435\u0440\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" })) }), formData.staffIds.length === 0 && (_jsx("div", { className: "text-red-500 text-sm mt-2", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u0430\u0441\u0442\u0435\u0440\u0430 \u0434\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0438" }))] })] })] }), _jsxs("div", { className: "xl:col-span-3 space-y-6", children: [_jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsxs(CardTitle, { className: "flex items-center text-lg", children: [_jsx(Calendar, { className: "w-6 h-6 mr-3" }), "\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F *"] }) }), _jsxs(CardContent, { className: "space-y-4 pt-0", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u0414\u0430\u0442\u0430" }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u041D\u0430\u0447\u0430\u043B\u043E" }), _jsx("input", { type: "time", step: "900", value: formData.startTime, onChange: (e) => handleTimeChange('startTime', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", required: true, placeholder: "HH:MM", pattern: "[0-9]{2}:[0-9]{2}" }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043E\u043A\u0440\u0443\u0433\u043B\u044F\u0435\u0442\u0441\u044F \u0434\u043E 15 \u043C\u0438\u043D\u0443\u0442 (00, 15, 30, 45)" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "\u041A\u043E\u043D\u0435\u0446" }), _jsx("input", { type: "time", step: "900", value: formData.endTime, readOnly: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600", required: true }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: "\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438" })] })] })] })] }), _jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsx(CardTitle, { className: "text-lg", children: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u043F\u0438\u0441\u0438" }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsx("div", { className: "grid grid-cols-2 gap-2", children: statusOptions.map((statusOption) => {
                                                                const Icon = statusOption.icon;
                                                                const isSelected = formData.status === statusOption.value;
                                                                return (_jsxs("button", { type: "button", onClick: () => setFormData(prev => ({ ...prev, status: statusOption.value })), className: `
                            relative p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                            ${isSelected
                                                                        ? `${statusOption.colorLight} border-current shadow-lg`
                                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}
                          `, children: [_jsxs("div", { className: "flex items-center justify-center space-x-2", children: [_jsx(Icon, { className: "w-4 h-4" }), _jsx("span", { className: "hidden sm:block", children: statusOption.label }), _jsx("span", { className: "block sm:hidden", children: statusOption.shortLabel })] }), isSelected && (_jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-current rounded-full" }))] }, statusOption.value));
                                                            }) }), _jsx("div", { className: "mt-3 text-center", children: _jsxs("div", { className: `inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(formData.status).colorLight}`, children: [React.createElement(getStatusStyles(formData.status).icon, { className: "w-4 h-4" }), _jsxs("span", { children: ["\u0412\u044B\u0431\u0440\u0430\u043D: ", getStatusStyles(formData.status).label] })] }) })] })] }), _jsx(AppointmentSummary, { selectedClient: clients.find(c => c.id === formData.clientId), selectedServices: selectedServices, selectedStaff: staff.find(s => s.id === formData.staffIds[0]), date: formData.date, startTime: formData.startTime, endTime: formData.endTime, totalPrice: totalPrice, totalDuration: totalDuration, status: formData.status })] })] }), _jsxs(Card, { className: "shadow-lg", children: [_jsx(CardHeader, { className: "pb-4", children: _jsx(CardTitle, { className: "text-lg", children: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438" }) }), _jsx(CardContent, { className: "pt-0", children: _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0437\u0430\u043F\u0438\u0441\u0438...", rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }) })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => navigate('/appointments'), children: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C" }), _jsxs(Button, { type: "submit", disabled: saving, className: "bg-green-600 hover:bg-green-700", children: [saving ? (_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" })) : (_jsx(Save, { className: "w-4 h-4 mr-2" })), isEdit ? 'Сохранить изменения' : 'Создать запись'] })] })] })] }) }));
}
