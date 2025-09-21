import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { X, Clock, User, Briefcase, Calendar, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useClients } from '../hooks/useClients';
import { useServices } from '../hooks/useServices';
import { useStaff } from '../hooks/useStaff';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../contexts/AuthContext';
export const AppointmentForm = ({ isOpen, onClose, initialDate = new Date(), onSuccess }) => {
    const { clients, loading: clientsLoading } = useClients();
    const { services, loading: servicesLoading } = useServices();
    const { staff, loading: staffLoading } = useStaff();
    const { tenantId } = useTenant();
    const {} = useAppointments({
        date: new Date(),
        view: 'day',
        filters: { staffIds: [], statuses: [] },
        salonId: tenantId || undefined
    });
    // Проверка доступности временного слота для мастера
    const checkStaffAvailability = async (staffId, date, startTime, endTime) => {
        if (!staffId || !date || !startTime || !endTime)
            return true;
        try {
            const startDateTime = `${date}T${startTime}:00`;
            const endDateTime = `${date}T${endTime}:00`;
            const response = await fetch(`/api/crm/appointments?staffId=${staffId}&startDate=${date}&endDate=${date}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok)
                return true; // В случае ошибки не блокируем
            const result = await response.json();
            const appointments = result.data || [];
            // Проверяем пересечения времени
            const hasConflict = appointments.some((apt) => {
                if (apt.status === 'CANCELLED')
                    return false;
                const aptStart = new Date(apt.startTime);
                const aptEnd = new Date(apt.endTime);
                const newStart = new Date(startDateTime);
                const newEnd = new Date(endDateTime);
                // Проверка пересечения: новое время начинается до окончания существующей записи
                // и заканчивается после начала существующей записи
                return (newStart < aptEnd && newEnd > aptStart);
            });
            return !hasConflict;
        }
        catch (error) {
            console.error('Error checking staff availability:', error);
            return true; // В случае ошибки не блокируем
        }
    };
    const createAppointment = async (formData) => {
        try {
            const response = await fetch('/api/crm/appointments', {
                method: 'POST',
                credentials: 'include', // JWT передается через httpOnly cookies
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: formData.clientId,
                    serviceId: formData.serviceId,
                    staffId: formData.assignedToId,
                    startAt: `${formData.date}T${formData.startTime}:00`,
                    endAt: `${formData.date}T${formData.endTime}:00`,
                    notes: formData.notes || ''
                })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API Error:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            const result = await response.json();
            console.log('✅ Appointment created successfully:', result);
            return result;
        }
        catch (error) {
            console.error('❌ Failed to create appointment:', error);
            throw error;
        }
    };
    const [formData, setFormData] = useState({
        date: format(initialDate, 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00',
        clientId: '',
        serviceId: '',
        assignedToId: '',
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [conflictWarning, setConflictWarning] = useState('');
    // Сброс формы при открытии
    useEffect(() => {
        if (isOpen) {
            setFormData({
                date: format(initialDate, 'yyyy-MM-dd'),
                startTime: '10:00',
                endTime: '11:00',
                clientId: '',
                serviceId: '',
                assignedToId: '',
                notes: ''
            });
            setErrors({});
            setConflictWarning('');
        }
    }, [isOpen, initialDate]);
    // Автоматический расчет времени окончания при выборе услуги или изменении времени начала
    useEffect(() => {
        if (formData.serviceId && formData.startTime) {
            const selectedService = services.find(s => s.id === formData.serviceId);
            if (selectedService && selectedService.duration) {
                const [hours, minutes] = formData.startTime.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;
                const endMinutes = startMinutes + selectedService.duration;
                // Обработка перехода через полночь
                const endHours = Math.floor(endMinutes / 60) % 24;
                const endMins = endMinutes % 60;
                const newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                // Обновляем только если время изменилось, чтобы избежать лишних ре-рендеров
                if (formData.endTime !== newEndTime) {
                    setFormData(prev => ({
                        ...prev,
                        endTime: newEndTime
                    }));
                }
            }
        }
    }, [formData.serviceId, formData.startTime, services, formData.endTime]);
    // Real-time проверка конфликтов мастера
    useEffect(() => {
        let timeoutId;
        const checkAvailability = async () => {
            if (formData.assignedToId && formData.date && formData.startTime && formData.endTime) {
                const isAvailable = await checkStaffAvailability(formData.assignedToId, formData.date, formData.startTime, formData.endTime);
                if (!isAvailable) {
                    setConflictWarning(`⚠️ Мастер уже занят в это время. Выберите другое время или мастера.`);
                }
                else {
                    setConflictWarning('');
                }
            }
            else {
                setConflictWarning('');
            }
        };
        // Debounce: проверяем через 500ms после последнего изменения
        timeoutId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timeoutId);
    }, [formData.assignedToId, formData.date, formData.startTime, formData.endTime]);
    // Обработка изменения полей
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Очищаем ошибку для этого поля
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };
    // Валидация формы
    const validateForm = () => {
        const newErrors = {};
        if (!formData.clientId)
            newErrors.clientId = 'Выберите клиента';
        if (!formData.serviceId)
            newErrors.serviceId = 'Выберите услугу';
        if (!formData.assignedToId)
            newErrors.assignedToId = 'Выберите мастера';
        if (!formData.date)
            newErrors.date = 'Выберите дату';
        if (!formData.startTime)
            newErrors.startTime = 'Укажите время начала';
        if (!formData.endTime)
            newErrors.endTime = 'Укажите время окончания';
        // Проверка логики времени
        if (formData.startTime && formData.endTime) {
            const startMinutes = timeToMinutes(formData.startTime);
            const endMinutes = timeToMinutes(formData.endTime);
            if (endMinutes <= startMinutes) {
                newErrors.endTime = 'Время окончания должно быть позже времени начала';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Конвертация времени в минуты
    const timeToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    // Обработка отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm())
            return;
        setIsSubmitting(true);
        try {
            const newAppointment = await createAppointment(formData);
            if (newAppointment) {
                onSuccess?.();
                onClose();
            }
        }
        catch (error) {
            console.error('Error creating appointment:', error);
            setErrors({ general: 'Ошибка при создании записи. Попробуйте снова.' });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    // Генерация временных слотов
    const generateTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 20; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs(Card, { className: "w-full max-w-2xl max-h-[90vh] overflow-hidden", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-4", children: [_jsx(CardTitle, { className: "text-xl font-semibold", children: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, disabled: isSubmitting, children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx(CardContent, { className: "overflow-y-auto", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [errors.general && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-md p-4 flex items-center", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-500 mr-3" }), _jsx("span", { className: "text-red-700", children: errors.general })] })), conflictWarning && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-center", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500 mr-3" }), _jsx("span", { className: "text-yellow-700", children: conflictWarning })] })), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), "\u041A\u043B\u0438\u0435\u043D\u0442 *"] }), _jsxs("select", { value: formData.clientId, onChange: (e) => handleInputChange('clientId', e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.clientId ? 'border-red-500' : 'border-gray-300'}`, disabled: clientsLoading || isSubmitting, children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }), clients.map((client) => (_jsxs("option", { value: client.id, children: [client.name, " ", client.phone && `(${client.phone})`] }, client.id)))] }), errors.clientId && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.clientId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(Briefcase, { className: "h-4 w-4 mr-2" }), "\u0423\u0441\u043B\u0443\u0433\u0430 *"] }), _jsxs("select", { value: formData.serviceId, onChange: (e) => handleInputChange('serviceId', e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.serviceId ? 'border-red-500' : 'border-gray-300'}`, disabled: servicesLoading || isSubmitting, children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0443\u0441\u043B\u0443\u0433\u0443" }), services.map((service) => (_jsxs("option", { value: service.id, children: [service.name, " (", service.duration, "\u043C\u0438\u043D, ", service.price, "\u20B4)"] }, service.id)))] }), errors.serviceId && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.serviceId }))] }), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(User, { className: "h-4 w-4 mr-2" }), "\u041C\u0430\u0441\u0442\u0435\u0440 *"] }), _jsxs("select", { value: formData.assignedToId, onChange: (e) => handleInputChange('assignedToId', e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.assignedToId ? 'border-red-500' : 'border-gray-300'}`, disabled: staffLoading || isSubmitting, children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u0430\u0441\u0442\u0435\u0440\u0430" }), staff.map((staffMember) => (_jsxs("option", { value: staffMember.id, children: [staffMember.firstName, " ", staffMember.lastName, staffMember.role && ` (${staffMember.role})`] }, staffMember.id)))] }), errors.assignedToId && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.assignedToId }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "h-4 w-4 mr-2" }), "\u0414\u0430\u0442\u0430 *"] }), _jsx("input", { type: "date", value: formData.date, onChange: (e) => handleInputChange('date', e.target.value), min: format(new Date(), 'yyyy-MM-dd'), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'}`, disabled: isSubmitting }), errors.date && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.date }))] }), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "\u041D\u0430\u0447\u0430\u043B\u043E *"] }), _jsx("select", { value: formData.startTime, onChange: (e) => handleInputChange('startTime', e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.startTime ? 'border-red-500' : 'border-gray-300'}`, disabled: isSubmitting, children: generateTimeSlots().map((time) => (_jsx("option", { value: time, children: time }, time))) }), errors.startTime && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.startTime }))] }), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "\u041E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0435 *"] }), _jsx("select", { value: formData.endTime, onChange: (e) => handleInputChange('endTime', e.target.value), className: `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.endTime ? 'border-red-500' : 'border-gray-300'}`, disabled: isSubmitting, children: generateTimeSlots().map((time) => (_jsx("option", { value: time, children: time }, time))) }), errors.endTime && (_jsx("span", { className: "text-red-500 text-sm mt-1", children: errors.endTime }))] })] }), _jsxs("div", { children: [_jsxs("label", { className: "flex items-center text-sm font-medium text-gray-700 mb-2", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "\u0417\u0430\u043C\u0435\u0442\u043A\u0438"] }), _jsx("textarea", { value: formData.notes || '', onChange: (e) => handleInputChange('notes', e.target.value), placeholder: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u0437\u0430\u043F\u0438\u0441\u0438...", rows: 3, className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none", disabled: isSubmitting })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4 border-t", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: isSubmitting, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", disabled: isSubmitting || clientsLoading || servicesLoading, children: isSubmitting ? 'Создание...' : 'Создать запись' })] })] }) })] }) }));
};
