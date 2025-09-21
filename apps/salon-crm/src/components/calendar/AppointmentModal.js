import { jsxs as _jsxs, Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, DollarSign, Search, Briefcase, Users, CreditCard, TrendingUp, TrendingDown, Maximize2, Minimize2, Phone, Mail, Edit3, Trash2, Plus, Minus, AlertTriangle, CheckCircle, Flag, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import api from '../../utils/api-client';
import { useTenant } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StaffCard } from './StaffCard';
import { useWorkingHours, isWithinWorkingHours } from '../../hooks/useWorkingHours';
import { useStaffSchedules, isStaffAvailable } from '../../hooks/useStaffSchedules';
const statusOptions = [
    {
        value: 'PENDING',
        label: 'Oczekująca',
        shortLabel: 'Oczek.',
        color: 'bg-yellow-500 hover:bg-yellow-600',
        icon: Timer
    },
    {
        value: 'CONFIRMED',
        label: 'Potwierdzona',
        shortLabel: 'Potw.',
        color: 'bg-blue-500 hover:bg-blue-600',
        icon: CheckCircle2
    },
    {
        value: 'COMPLETED',
        label: 'Zakończona',
        shortLabel: 'Zak.',
        color: 'bg-green-500 hover:bg-green-600',
        icon: CheckCircle
    },
    {
        value: 'CANCELED',
        label: 'Anulowana',
        shortLabel: 'Anul.',
        color: 'bg-red-500 hover:bg-red-600',
        icon: XCircle
    }
];
export const AppointmentModal = ({ appointmentId, initialDate, mode, onClose, onUpdate, onModeChange }) => {
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    // Data for new appointments
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    // New appointment form state
    const [formData, setFormData] = useState({
        clientId: '',
        serviceIds: [],
        staffIds: [],
        date: initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: initialDate ? format(initialDate, 'HH:mm') : '09:00',
        endTime: initialDate ? format(addMinutes(initialDate, 60), 'HH:mm') : '10:00',
        status: 'CONFIRMED',
        notes: ''
    });
    // Appointment number for display
    const [appointmentNumber, setAppointmentNumber] = useState('');
    // REMOVED: generatingNumberRef (no longer needed)
    // Modal size management - open fullscreen by default
    const [modalSize, setModalSize] = useState('fullscreen');
    // Search states
    const [clientSearch, setClientSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [selectedClientLanguage, setSelectedClientLanguage] = useState('pl');
    const [showAllServices, setShowAllServices] = useState(false);
    // Filtered data based on selections
    const [availableStaff, setAvailableStaff] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);
    const { token, role } = useTenant();
    const { showToast } = useToast();
    // Удобные функции для уведомлений
    const success = (title, description) => showToast({ title, description, variant: 'success' });
    const showError = (title, description) => showToast({ title, description, variant: 'destructive' });
    const { workingHours } = useWorkingHours();
    const { schedules: staffSchedules } = useStaffSchedules();
    const isNewAppointment = !appointmentId;
    console.log('[AppointmentModal] Component mounted with props:', {
        appointmentId,
        mode,
        initialDate: initialDate?.toISOString(),
        token: !!token
    });
    // Determine modal mode
    const modalMode = mode || (isNewAppointment ? 'CREATE' : 'VIEW');
    const isReadOnly = modalMode === 'VIEW';
    const isEditing = modalMode === 'EDIT';
    const isCreating = modalMode === 'CREATE';
    useEffect(() => {
        if (appointmentId && token) {
            fetchAppointment();
            if (isEditing) {
                fetchFormData(); // Load form data for editing
            }
        }
        else if (isCreating && token) {
            fetchFormData();
        }
    }, [appointmentId, token, modalMode]);
    // Load appointment data into form when switching to edit mode
    useEffect(() => {
        if (appointment && isEditing) {
            setFormData({
                clientId: appointment.clientId,
                serviceIds: appointment.serviceIds,
                staffIds: [appointment.staffId], // Convert single staff to array
                date: format(new Date(appointment.startAt), 'yyyy-MM-dd'),
                startTime: format(new Date(appointment.startAt), 'HH:mm'),
                endTime: format(new Date(appointment.endAt), 'HH:mm'),
                status: appointment.status,
                notes: appointment.notes || ''
            });
        }
    }, [appointment, isEditing]);
    useEffect(() => {
        // Auto-calculate end time based on selected services
        if (formData.serviceIds.length > 0) {
            const totalDuration = formData.serviceIds.reduce((total, serviceId) => {
                const service = services.find(s => s.id === serviceId);
                return total + (service?.duration || 0);
            }, 0);
            const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
            const endDateTime = addMinutes(startDateTime, totalDuration);
            setFormData(prev => ({
                ...prev,
                endTime: format(endDateTime, 'HH:mm')
            }));
        }
    }, [formData.serviceIds, formData.startTime, formData.date, services]);
    // Dynamic filtering: Services -> Staff
    useEffect(() => {
        if (formData.serviceIds.length > 0) {
            // Filter staff who can perform ALL selected services
            const compatibleStaff = staff.filter(member => {
                // Check if staff can perform all selected services
                const canPerformServices = formData.serviceIds.every(serviceId => {
                    return member.availableServices?.includes(serviceId) ?? false;
                });
                // Check language compatibility if client language is selected
                const languageCompatible = !selectedClientLanguage ||
                    (member.spokenLocales?.includes(selectedClientLanguage) ?? true);
                return canPerformServices && languageCompatible && member.active;
            });
            setAvailableStaff(compatibleStaff);
            // Clear staff selection if any selected staff can't perform selected services
            const validStaffIds = formData.staffIds.filter(staffId => compatibleStaff.find(s => s.id === staffId));
            if (validStaffIds.length !== formData.staffIds.length) {
                setFormData(prev => ({ ...prev, staffIds: validStaffIds }));
            }
        }
        else {
            // Show all active staff with language filter and at least one service
            const filteredStaff = staff.filter(member => {
                const languageCompatible = !selectedClientLanguage ||
                    (member.spokenLocales?.includes(selectedClientLanguage) ?? true);
                const hasServices = member.availableServices && member.availableServices.length > 0;
                return languageCompatible && member.active && hasServices;
            });
            setAvailableStaff(filteredStaff);
        }
    }, [formData.serviceIds, staff, services, selectedClientLanguage]);
    // Загружаем расписания для выбранных мастеров
    useEffect(() => {
        if (formData.staffIds.length > 0) {
            formData.staffIds.forEach(staffId => {
                const staffSchedule = staffSchedules.find(s => s.staffId === staffId);
                if (!staffSchedule) {
                    console.log('Schedule for staff:', staffId, 'not loaded');
                    // TODO: Implement fetchSchedule when API is ready
                }
            });
        }
    }, [formData.staffIds, staffSchedules]);
    // Dynamic filtering: Staff -> Services
    useEffect(() => {
        if (formData.staffIds.length > 0) {
            // Get all services that ANY of the selected staff can perform
            const compatibleServices = services.filter(service => formData.staffIds.some(staffId => {
                const selectedStaff = staff.find(s => s.id === staffId);
                return selectedStaff?.availableServices?.includes(service.id) || !selectedStaff?.availableServices;
            }));
            setAvailableServices(compatibleServices);
            // Remove any selected services that NONE of the staff can perform
            const validServiceIds = formData.serviceIds.filter(serviceId => formData.staffIds.some(staffId => {
                const selectedStaff = staff.find(s => s.id === staffId);
                return selectedStaff?.availableServices?.includes(serviceId) || !selectedStaff?.availableServices;
            }));
            if (validServiceIds.length !== formData.serviceIds.length) {
                setFormData(prev => ({ ...prev, serviceIds: validServiceIds }));
            }
        }
        else {
            setAvailableServices(services);
        }
    }, [formData.staffIds, staff, services]);
    const fetchAppointment = async () => {
        if (!appointmentId || !token) {
            console.log('[AppointmentModal] fetchAppointment skipped:', { appointmentId, token });
            return;
        }
        console.log('[AppointmentModal] Starting fetchAppointment for:', appointmentId);
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/crm/appointments/${appointmentId}`);
            console.log('[AppointmentModal] Appointment loaded successfully:', response);
            setAppointment(response);
            // Set appointment number from API response
            if (response.id) {
                setAppointmentNumber(response.id.replace('appt_', ''));
            }
            // Fetch client details to get phone number
            if (response.clientId) {
                try {
                    const clientResponse = await api.get(`/crm/clients/${response.clientId}`);
                    setAppointment(prev => prev ? {
                        ...prev,
                        clientPhone: clientResponse.phone,
                        clientEmail: clientResponse.email
                    } : null);
                }
                catch (clientErr) {
                    console.log('[AppointmentModal] Failed to fetch client details:', clientErr);
                    // Don't fail the whole modal for missing client details
                }
            }
        }
        catch (err) {
            console.error('[AppointmentModal] Failed to fetch appointment:', err);
            setError('Nie udało się załadować danych wizyty');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchFormData = async () => {
        if (!token)
            return;
        setLoadingData(true);
        try {
            const [clientsRes, servicesRes, staffRes] = await Promise.all([
                api.get('/crm/clients'),
                api.get('/crm/services'),
                fetch('/api/crm/staff', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                }).then(res => res.json()).then(data => data.data || [])
            ]);
            setClients(clientsRes);
            setServices(servicesRes);
            // Transform staff data from API format and filter active
            const staffData = (staffRes || []).map((s) => ({
                ...s, // Preserve all original StaffMember fields
                name: `${s.firstName} ${s.lastName}`.trim(),
                active: s.status === 'ACTIVE',
                availableServices: s.availableServices || []
            })).filter((s) => s.status === 'ACTIVE');
            setStaff(staffData);
        }
        catch (err) {
            console.error('Failed to fetch form data:', err);
            setError('Nie udało się załadować danych formularza');
            showError('Nie udało się załadować danych formularza');
        }
        finally {
            setLoadingData(false);
        }
    };
    const handleStatusChange = async (newStatus) => {
        if (!appointment || !token)
            return;
        setSaving(true);
        try {
            await api.put(`/crm/appointments/${appointment.id}/status`, {
                status: newStatus
            });
            setAppointment({ ...appointment, status: newStatus });
            onUpdate(appointment.id, newStatus);
            success('Status wizyty został zaktualizowany');
        }
        catch (err) {
            console.error('Failed to update status:', err);
            setError('Nie udało się zaktualizować statusu');
            showError('Nie udało się zaktualizować statusu');
        }
        finally {
            setSaving(false);
        }
    };
    const handleCreateAppointment = async () => {
        if (!token || !validateForm())
            return;
        // Проверка доступности мастера
        const isAvailable = await checkStaffAvailability();
        if (!isAvailable)
            return;
        setSaving(true);
        setError(null);
        try {
            // Convert to UTC properly for Polish timezone (UTC+1/+2)
            const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
            const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
            // Adjust for Polish timezone offset (assuming Europe/Warsaw)
            const polandOffset = 1 * 60; // UTC+1 in minutes, adjust for daylight saving time if needed
            startDateTime.setMinutes(startDateTime.getMinutes() - polandOffset);
            endDateTime.setMinutes(endDateTime.getMinutes() - polandOffset);
            const appointmentData = {
                clientId: formData.clientId,
                serviceIds: formData.serviceIds,
                staffId: formData.staffIds[0] || '', // For now, use first selected staff (API supports single staff)
                startAt: startDateTime.toISOString(),
                endAt: endDateTime.toISOString(),
                status: formData.status,
                notes: formData.notes || undefined
            };
            await api.post('/crm/appointments', appointmentData);
            success('Wizyta została pomyślnie utworzona');
            onUpdate('new', 'CONFIRMED');
            onClose();
        }
        catch (err) {
            console.error('Failed to create appointment:', err);
            setError('Nie udało się utworzyć wizyty');
            showError('Nie udało się utworzyć wizyty');
        }
        finally {
            setSaving(false);
        }
    };
    const handleUpdateAppointment = async () => {
        if (!token || !appointmentId || !validateForm())
            return;
        setSaving(true);
        setError(null);
        try {
            // Convert to UTC properly for Polish timezone (UTC+1/+2)
            const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
            const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);
            // Adjust for Polish timezone offset (assuming Europe/Warsaw)
            const polandOffset = 1 * 60; // UTC+1 in minutes, adjust for daylight saving time if needed
            startDateTime.setMinutes(startDateTime.getMinutes() - polandOffset);
            endDateTime.setMinutes(endDateTime.getMinutes() - polandOffset);
            const appointmentData = {
                clientId: formData.clientId,
                serviceIds: formData.serviceIds,
                staffId: formData.staffIds[0] || '', // For now, use first selected staff (API supports single staff)
                startAt: startDateTime.toISOString(),
                endAt: endDateTime.toISOString(),
                status: formData.status,
                notes: formData.notes || undefined
            };
            const response = await api.put(`/crm/appointments/${appointmentId}`, appointmentData);
            // Update appointment number if returned from API
            if (response.id) {
                setAppointmentNumber(response.id.replace('appt_', ''));
            }
            success('Wizyta została zaktualizowana');
            onUpdate(appointmentId, formData.status, true); // Pass actual status and isFullUpdate flag
            onClose();
        }
        catch (err) {
            console.error('Failed to update appointment:', err);
            setError('Nie udało się zaktualizować wizyty');
            showError('Nie udało się zaktualizować wizyty');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteAppointment = async () => {
        if (!token || !appointmentId || !appointment)
            return;
        // Double confirmation for admin delete action
        const confirmMessage = `Czy na pewno chcesz usunąć wizytę?\n\nKlient: ${appointment.clientName}\nData: ${format(new Date(appointment.startAt), 'dd.MM.yyyy HH:mm')}\n\nTa akcja zostanie zapisana w logach.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        setSaving(true);
        setError(null);
        try {
            console.log(`[ADMIN ACTION] Deleting appointment ${appointmentId} by ${role} user`);
            const response = await api.delete(`/crm/appointments/${appointmentId}`);
            // Log successful deletion
            console.log(`[ADMIN ACTION] Successfully deleted appointment:`, response);
            success('Wizyta została usunięta przez administratora');
            onUpdate(appointmentId, 'CANCELED');
            onClose();
        }
        catch (err) {
            console.error('[ADMIN ACTION] Failed to delete appointment:', err);
            if (err.response?.status === 403) {
                setError('Brak uprawnień do usuwania wizyt');
                showError('Brak uprawnień do usuwania wizyt');
            }
            else {
                setError('Nie udało się usunąć wizyty');
                showError('Nie udało się usunąć wizyty');
            }
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddPayment = () => {
        if (!appointment)
            return;
        // Calculate total price from selected services
        const totalPrice = appointment.serviceNames?.length > 0
            ? appointment.price || 0
            : 0;
        // Create a payment for this appointment
        const paymentData = {
            appointmentId: appointment.id,
            clientId: appointment.clientId,
            amount: totalPrice,
            currency: 'PLN',
            paymentMethod: 'cash',
            status: 'completed'
        };
        // Navigate to payments page with pre-filled data
        // We'll store this in sessionStorage so the payments page can pick it up
        sessionStorage.setItem('pendingPayment', JSON.stringify(paymentData));
        // Close modal and navigate to payments
        onClose();
        window.location.href = '/payments';
    };
    // Проверка доступности мастера  
    const checkStaffAvailability = async () => {
        try {
            if (formData.staffIds.length === 0)
                return true; // Будет проверено в основной валидации
            const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
            const queryParams = new URLSearchParams({
                staffIds: formData.staffIds.join(','),
                date: formData.date,
                startTime: formData.startTime,
                duration: totalDuration.toString()
            });
            const response = await api.get(`/crm/appointments/check-availability?${queryParams}`);
            if (response.data && !response.data.available) {
                const conflicts = response.data.conflicts || [];
                const conflictInfo = conflicts.length > 0
                    ? `Konflikt z ${conflicts[0].staffName} o ${conflicts[0].time}`
                    : 'Masz już wizytę w tym czasie';
                setError(`Wybrany termin nie jest dostępny. ${conflictInfo}`);
                showError(`Wybrany termin nie jest dostępny. ${conflictInfo}`);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error checking staff availability:', error);
            // Nie blokujemy w przypadku błędu API - pozwalamy kontynuować
            return true;
        }
    };
    const validateForm = () => {
        if (!formData.clientId) {
            setError('Wybierz klienta');
            showError('Wybierz klienta');
            return false;
        }
        if (formData.serviceIds.length === 0) {
            setError('Wybierz przynajmniej jedną usługę');
            showError('Wybierz przynajmniej jedną usługę');
            return false;
        }
        if (formData.staffIds.length === 0) {
            setError('Wybierz przynajmniej jednego pracownika');
            showError('Wybierz przynajmniej jednego pracownika');
            return false;
        }
        if (!formData.date || !formData.startTime) {
            setError('Wybierz datę i czas');
            showError('Wybierz datę i czas');
            return false;
        }
        // Проверка что дата и время не в прошлом
        const appointmentDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
        const now = new Date();
        if (appointmentDateTime < now) {
            setError('Nie można umówić wizyty w przeszłości');
            showError('Nie można umówić wizyty w przeszłości');
            return false;
        }
        // Проверка рабочих часов салона
        const appointmentDate = new Date(formData.date);
        const timeParts = formData.startTime.split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        appointmentDate.setHours(hours, minutes);
        // Check salon working hours
        if (!isWithinWorkingHours(appointmentDate, workingHours)) {
            setError('Wybrana godzina jest poza godzinami pracy salonu');
            showError('Wybrana godzina jest poza godzinami pracy salonu');
            return false;
        }
        // Check staff personal schedules if staff is selected
        if (formData.staffIds.length > 0) {
            for (const staffId of formData.staffIds) {
                const staffSchedule = staffSchedules.filter(s => s.staffId === staffId);
                if (!isStaffAvailable(staffId, appointmentDate, staffSchedule)) {
                    const staff = availableStaff.find(s => s.id === staffId);
                    const staffName = staff?.name || 'Wybrany pracownik';
                    setError(`${staffName} nie jest dostępny w wybranym czasie`);
                    showError(`${staffName} nie jest dostępny w wybranym czasie`);
                    return false;
                }
            }
        }
        return true;
    };
    const filteredClients = clients.filter(client => client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.phone && client.phone.includes(clientSearch)));
    const filteredServices = availableServices.filter(service => service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        false // category field not available in imported Service
    );
    const selectedServices = services.filter(s => formData.serviceIds.includes(s.id));
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    // Check if user can select date/time
    const canSelectDateTime = formData.staffIds.length > 0 && formData.serviceIds.length > 0;
    const formatDateTime = (datetime) => {
        return format(new Date(datetime), 'EEEE, d MMMM yyyy · HH:mm');
    };
    const formatPrice = (price, currency) => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: currency
        }).format(price);
    };
    const formatDateTimeDisplay = (date, time) => {
        try {
            const dateTime = new Date(`${date}T${time}`);
            return format(dateTime, 'EEEE, d MMMM yyyy · HH:mm');
        }
        catch {
            return `${date} ${time}`;
        }
    };
    // COMPLETELY DISABLED - this function was causing system crashes
    // const generateAppointmentNumber = useCallback(async (date: Date): Promise<string> => { ... }
    // REMOVED: Problematic useEffect that was causing infinite API calls
    // Generate appointment number when date changes or for new appointments
    useEffect(() => {
        if (isNewAppointment && formData.date && token) {
            const generateNumber = async () => {
                try {
                    const response = await fetch(`/api/crm/appointments/generate-number?date=${formData.date}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setAppointmentNumber(data.appointmentNumber);
                    }
                    else {
                        // Fallback to simple format
                        const dateObj = new Date(formData.date);
                        const displayDate = dateObj.toLocaleDateString('pl-PL');
                        setAppointmentNumber(`001.02.${displayDate}`);
                    }
                }
                catch (error) {
                    console.error('Failed to generate appointment number:', error);
                    // Fallback to simple format
                    const dateObj = new Date(formData.date);
                    const displayDate = dateObj.toLocaleDateString('pl-PL');
                    setAppointmentNumber(`001.02.${displayDate}`);
                }
            };
            generateNumber();
        }
    }, [isNewAppointment, formData.date, token]);
    return (_jsx("div", { className: `fixed inset-0 z-50 transition-all duration-300 ${modalSize === 'minimized'
            ? 'pointer-events-none'
            : 'bg-black bg-opacity-50 flex items-center justify-center'}`, children: _jsxs("div", { className: `bg-white shadow-xl transition-all duration-300 ${modalSize === 'fullscreen'
                ? 'w-screen h-screen rounded-none'
                : modalSize === 'normal'
                    ? 'max-w-4xl w-full mx-4 max-h-[90vh] rounded-lg'
                    : 'w-80 h-20 fixed bottom-4 right-4 rounded-lg pointer-events-auto shadow-2xl'} overflow-hidden`, children: [_jsxs("div", { className: `flex items-center justify-between border-b border-gray-200 ${modalSize === 'minimized' ? 'p-3' : 'p-6'}`, children: [_jsxs("div", { className: modalSize === 'minimized' ? 'truncate' : '', children: [_jsxs("h2", { className: `font-semibold text-gray-900 ${modalSize === 'minimized' ? 'text-sm' : 'text-xl'}`, children: [modalMode === 'CREATE' && 'Nowa wizyta', modalMode === 'EDIT' && 'Edytuj wizytę', modalMode === 'VIEW' && 'Szczegóły wizyty'] }), modalSize !== 'minimized' && (_jsxs(_Fragment, { children: [modalMode === 'CREATE' && appointmentNumber && (_jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Numer: ", _jsxs("span", { className: "font-mono font-medium text-blue-600", children: ["#", appointmentNumber] })] })), appointment && modalMode !== 'CREATE' && (_jsxs("p", { className: "text-sm text-gray-500 mt-1", children: ["Numer: ", _jsxs("span", { className: "font-mono font-medium text-blue-600", children: ["#", appointment.id.replace('appt_', '')] })] }))] }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [modalSize === 'minimized' ? (_jsx("button", { onClick: () => setModalSize('normal'), className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", title: "Rozszerz", children: _jsx(TrendingUp, { className: "h-5 w-5" }) })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setModalSize('minimized'), className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", title: "Zminimalizuj", children: _jsx(TrendingDown, { className: "h-5 w-5" }) }), _jsx("button", { onClick: () => setModalSize(modalSize === 'fullscreen' ? 'normal' : 'fullscreen'), className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", title: modalSize === 'fullscreen' ? 'Normalizuj' : 'Pełny ekran', children: modalSize === 'fullscreen' ? _jsx(Minimize2, { className: "h-5 w-5" }) : _jsx(Maximize2, { className: "h-5 w-5" }) })] })), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", title: "Zamknij", children: _jsx(X, { className: "h-5 w-5" }) })] })] }), modalSize === 'minimized' ? (
                // Minimized content - just show basic info
                _jsxs("div", { className: "px-3 py-1 text-xs text-gray-600 truncate", children: [modalMode === 'CREATE' && 'Tworzenie nowej wizyty...', modalMode === 'EDIT' && 'Edycja wizyty...', modalMode === 'VIEW' && appointment && `${appointment.clientName} - ${format(new Date(appointment.startAt), 'HH:mm')}`] })) : (_jsx("div", { className: `overflow-y-auto ${modalSize === 'fullscreen' ? 'h-[calc(100vh-200px)] p-8' : 'max-h-[calc(90vh-200px)] p-6'}`, children: loading || loadingData ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("span", { className: "ml-2", children: "\u0141adowanie..." })] })) : error ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-red-600 mb-4 p-4 bg-red-50 rounded-lg", children: error }), _jsx("button", { onClick: () => {
                                    setError(null);
                                    if (isNewAppointment) {
                                        fetchFormData();
                                    }
                                    else {
                                        fetchAppointment();
                                    }
                                }, className: "btn-secondary", children: "Spr\u00F3buj ponownie" })] })) : (modalMode === 'CREATE' || (modalMode === 'EDIT' && appointment)) ? (
                    /* NEW APPOINTMENT FORM */
                    _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("div", { className: "relative", children: availableStaff.length > 0 ? (_jsx("div", { className: "flex space-x-4 overflow-x-auto py-2", children: availableStaff.map((member) => (_jsx(StaffCard, { staff: member, selected: formData.staffIds.includes(member.id), onClick: () => {
                                                    const isSelected = formData.staffIds.includes(member.id);
                                                    if (isEditing) {
                                                        // In edit mode, allow only one staff member (database limitation)
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            staffIds: isSelected ? [] : [member.id]
                                                        }));
                                                    }
                                                    else {
                                                        // In create mode, support multiple staff selection
                                                        if (isSelected) {
                                                            // Remove from selection
                                                            const newStaffIds = formData.staffIds.filter(id => id !== member.id);
                                                            setFormData(prev => ({ ...prev, staffIds: newStaffIds }));
                                                        }
                                                        else {
                                                            // Add to selection
                                                            setFormData(prev => ({ ...prev, staffIds: [...prev.staffIds, member.id] }));
                                                        }
                                                    }
                                                }, disabled: isReadOnly, className: "flex-shrink-0" }, member.id))) })) : (_jsxs("div", { className: "text-center py-6 border-2 border-dashed border-gray-300 rounded-lg", children: [_jsx(Users, { className: "w-8 h-8 text-gray-400 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Brak dost\u0119pnych pracownik\u00F3w" })] })) }), formData.serviceIds.length > 0 && availableStaff.length === 0 && (_jsxs("div", { className: "mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-yellow-600 inline mr-1" }), " Brak dost\u0119pnych pracownik\u00F3w dla wybranych us\u0142ug"] }))] }), _jsxs("div", { className: "flex items-start justify-between space-x-6", children: [_jsx("div", { className: "flex-1", children: _jsx("div", { className: "flex space-x-2 overflow-x-auto", children: statusOptions.map((option) => {
                                                const Icon = option.icon;
                                                const isSelected = formData.status === option.value;
                                                return (_jsxs("button", { onClick: () => setFormData(prev => ({ ...prev, status: option.value })), disabled: saving, title: option.label, className: `
                            flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                            ${isSelected
                                                        ? `${option.color} text-white`
                                                        : `bg-gray-400 text-white hover:${option.color.replace('bg-', 'bg-')} hover:opacity-75`}
                            ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            group
                          `, children: [_jsx(Icon, { className: "h-4 w-4 mr-2 md:mr-1" }), _jsx("span", { className: "hidden md:inline", children: option.shortLabel }), _jsx("span", { className: "md:hidden sr-only", children: option.label }), _jsx("span", { className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 md:hidden", children: option.label })] }, option.value));
                                            }) }) }), _jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: "flex space-x-2", children: [
                                                { code: 'pl', label: 'Polski', name: 'PL', flag: _jsx(Flag, { className: "h-3 w-3 text-red-600" }) },
                                                { code: 'ru', label: 'Русский', name: 'RU', flag: _jsx(Flag, { className: "h-3 w-3 text-blue-600" }) },
                                                { code: 'uk', label: 'Українська', name: 'UA', flag: _jsx(Flag, { className: "h-3 w-3 text-yellow-600" }) },
                                                { code: 'en', label: 'English', name: 'EN', flag: _jsx(Flag, { className: "h-3 w-3 text-blue-800" }) }
                                            ].map((lang) => (_jsxs("button", { type: "button", onClick: () => !isReadOnly && setSelectedClientLanguage(lang.code), disabled: isReadOnly, title: lang.label, className: `
                          flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                          ${selectedClientLanguage === lang.code
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-400 text-white hover:bg-blue-500 hover:opacity-75'}
                          ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          group
                        `, children: [_jsx("span", { className: "hidden md:inline", children: lang.name }), _jsx("span", { className: "md:hidden sr-only", children: lang.label }), _jsx("span", { className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 md:hidden", children: lang.label })] }, lang.code))) }) })] }), _jsxs("div", { className: `${modalSize === 'fullscreen'
                                    ? 'grid grid-cols-3 gap-8 h-full'
                                    : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`, children: [_jsx("div", { className: `${modalSize === 'fullscreen' ? 'space-y-6 overflow-y-auto' : 'space-y-4'}`, children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(User, { className: "w-4 h-4 inline mr-1" }), "Klient *"] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Szukaj klienta...", value: clientSearch, onChange: (e) => setClientSearch(e.target.value), disabled: isReadOnly, className: `w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}` })] }), _jsx("div", { className: "mt-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg", children: filteredClients.map((client) => (_jsxs("button", { onClick: () => setFormData(prev => ({ ...prev, clientId: client.id })), className: `w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${formData.clientId === client.id ? 'bg-blue-50 text-blue-700' : ''}`, children: [_jsx("div", { className: "font-medium", children: client.name }), client.phone && _jsx("div", { className: "text-sm text-gray-500", children: client.phone })] }, client.id))) })] }) }), _jsx("div", { className: `${modalSize === 'fullscreen' ? 'space-y-6 overflow-y-auto' : 'space-y-4'}`, children: _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Briefcase, { className: "w-4 h-4 inline mr-1" }), "Us\u0142ugi * ", isEditing && (_jsx("span", { className: "text-xs text-amber-600 font-normal", children: "(w trybie edycji mo\u017Cna wybra\u0107 tylko jedn\u0105 us\u0142ug\u0119)" }))] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Szukaj us\u0142ugi...", value: serviceSearch, onChange: (e) => setServiceSearch(e.target.value), disabled: isReadOnly, className: `w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}` })] }), _jsx("div", { className: "mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg", children: filteredServices.map((service) => {
                                                        const isSelected = formData.serviceIds.includes(service.id);
                                                        const isCompatibleWithStaff = formData.staffIds.length === 0 ||
                                                            availableServices.includes(service);
                                                        return (_jsx("button", { onClick: () => {
                                                                if (isEditing) {
                                                                    // In edit mode, allow only one service (database limitation)
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        serviceIds: isSelected ? [] : [service.id]
                                                                    }));
                                                                }
                                                                else {
                                                                    // In create mode, allow multiple services (though only first will be saved)
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        serviceIds: isSelected
                                                                            ? prev.serviceIds.filter(id => id !== service.id)
                                                                            : [...prev.serviceIds, service.id]
                                                                    }));
                                                                }
                                                            }, disabled: !isCompatibleWithStaff, className: `w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${isSelected ? 'bg-green-50 text-green-700 border-green-200' : ''} ${!isCompatibleWithStaff ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`, children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "font-medium flex items-center", children: [service.name, !isCompatibleWithStaff && (_jsxs("span", { className: "ml-2 text-xs text-red-500 flex items-center", children: [_jsx(AlertTriangle, { className: "h-3 w-3 mr-1" }), " Niedost\u0119pne dla wybranego pracownika"] }))] }), _jsxs("div", { className: "text-sm text-gray-500", children: [service.duration, " min \u2022 ", formatPrice(service.price, 'PLN')] })] }), isSelected && (_jsx("div", { className: "text-green-600 font-medium ml-2", children: _jsx(CheckCircle, { className: "h-4 w-4" }) }))] }) }, service.id));
                                                    }) }), formData.serviceIds.length > 0 && !showAllServices && (_jsx("div", { className: "mt-3", children: _jsxs("button", { type: "button", onClick: () => setShowAllServices(true), className: "text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center", children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), " Dodaj wi\u0119cej us\u0142ug"] }) })), showAllServices && (_jsxs("div", { className: "mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h4", { className: "text-sm font-medium text-blue-900", children: "Wszystkie dost\u0119pne us\u0142ugi" }), _jsxs("button", { type: "button", onClick: () => setShowAllServices(false), className: "text-blue-600 hover:text-blue-800 text-xs", children: [_jsx(Minus, { className: "h-4 w-4 mr-1" }), " Zwi\u0144"] })] }), _jsx("div", { className: "max-h-32 overflow-y-auto border border-blue-300 rounded bg-white", children: services.filter(service => !formData.serviceIds.includes(service.id)).map((service) => {
                                                                const isCompatible = formData.staffIds.length === 0 || availableServices.includes(service);
                                                                return (_jsx("button", { onClick: () => {
                                                                        if (isCompatible) {
                                                                            setFormData(prev => ({
                                                                                ...prev,
                                                                                serviceIds: [...prev.serviceIds, service.id]
                                                                            }));
                                                                        }
                                                                    }, disabled: !isCompatible, className: `w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${!isCompatible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`, children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: service.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [service.duration, " min \u2022 ", formatPrice(service.price, 'PLN')] })] }), !isCompatible && (_jsxs("span", { className: "text-xs text-red-500 flex items-center", children: [_jsx(AlertTriangle, { className: "h-3 w-3 mr-1" }), " Niedost\u0119pne"] }))] }) }, service.id));
                                                            }) })] }))] }) }), _jsxs("div", { className: `${modalSize === 'fullscreen' ? 'space-y-8 overflow-y-auto' : 'space-y-6'}`, children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-3", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "Data i godzina * ", canSelectDateTime && (_jsxs("span", { className: "ml-2 text-green-600 text-xs flex items-center", children: [_jsx(CheckCircle, { className: "h-3 w-3 mr-1" }), " Gotowe do wyboru"] }))] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("input", { type: "date", value: formData.date, onChange: (e) => setFormData(prev => ({ ...prev, date: e.target.value })), disabled: isReadOnly, className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}` }), _jsx("label", { className: "block text-xs text-gray-500 mt-1", children: "Data" })] }), _jsxs("div", { children: [_jsx("select", { value: formData.startTime, onChange: (e) => setFormData(prev => ({ ...prev, startTime: e.target.value })), disabled: isReadOnly, className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : ''}`, children: Array.from({ length: 24 }, (_, hour) => ['00', '15', '30', '45'].map(minute => {
                                                                            const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                                                                            const appointmentDate = formData.date ? new Date(formData.date) : new Date();
                                                                            let isAvailable = false;
                                                                            if (formData.staffIds.length > 0) {
                                                                                // Если выбран конкретный мастер, проверяем его персональный график
                                                                                isAvailable = formData.staffIds.some(staffId => {
                                                                                    const timeSlot = new Date(appointmentDate);
                                                                                    timeSlot.setHours(hour, parseInt(minute));
                                                                                    const staffSchedule = staffSchedules.filter(s => s.staffId === staffId);
                                                                                    return isStaffAvailable(staffId, timeSlot, staffSchedule);
                                                                                });
                                                                            }
                                                                            else {
                                                                                // Если мастер не выбран, проверяем общие часы салона
                                                                                const timeSlot = new Date(appointmentDate);
                                                                                timeSlot.setHours(hour, parseInt(minute));
                                                                                isAvailable = isWithinWorkingHours(timeSlot, workingHours);
                                                                            }
                                                                            // Показываем только доступные временные слоты
                                                                            if (!isAvailable)
                                                                                return null;
                                                                            return (_jsx("option", { value: timeStr, children: timeStr }, timeStr));
                                                                        })).flat().filter(Boolean) }), _jsx("label", { className: "block text-xs text-gray-500 mt-1", children: "Godzina rozpocz\u0119cia" })] })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Podsumowanie wizyty" }), formData.clientId && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Klient" }), _jsx("div", { className: "font-medium", children: clients.find(c => c.id === formData.clientId)?.name })] })), selectedServices.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-sm text-gray-500 mb-2", children: "Us\u0142ugi" }), _jsx("div", { className: "space-y-1", children: selectedServices.map((service) => (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { children: service.name }), _jsx("span", { children: formatPrice(service.price, 'PLN') })] }, service.id))) })] })), formData.staffIds.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: formData.staffIds.length === 1 ? 'Pracownik' : 'Pracownicy' }), _jsx("div", { className: "font-medium", children: formData.staffIds.length === 1
                                                                    ? staff.find(s => s.id === formData.staffIds[0])?.name
                                                                    : formData.staffIds.map(staffId => staff.find(s => s.id === staffId)?.name).filter(Boolean).join(', ') })] })), formData.date && formData.startTime && (_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-sm text-gray-500", children: "Data i czas" }), _jsx("div", { className: "font-medium", children: formatDateTimeDisplay(formData.date, formData.startTime) }), _jsxs("div", { className: "text-sm text-gray-500", children: ["Zako\u0144czenie: ", formData.endTime] })] })), selectedServices.length > 0 && (_jsxs("div", { className: "pt-4 border-t border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: "text-sm text-gray-500", children: "Czas trwania" }), _jsxs("span", { className: "font-medium", children: [totalDuration, " min"] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-500", children: "\u0141\u0105czna cena" }), _jsx("span", { className: "text-lg font-bold", children: formatPrice(totalPrice, 'PLN') })] })] }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Notatki" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(prev => ({ ...prev, notes: e.target.value })), placeholder: "Dodatkowe informacje...", rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] })] })] })) : modalMode === 'VIEW' ? (appointment ? (
                    /* EXISTING APPOINTMENT VIEW - 2 COLUMN LAYOUT */
                    _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Informacje o kliencie" }), _jsxs("div", { className: "flex items-center space-x-4 mb-4", children: [_jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-xl", children: appointment.clientName.charAt(0).toUpperCase() }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: appointment.clientName }), _jsx("p", { className: "text-sm text-gray-500", children: "Klient" })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(Phone, { className: "h-4 w-4 text-green-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Telefon" }), _jsx("p", { className: "text-sm text-gray-600", children: 'Brak numeru telefonu' })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center", children: _jsx(Mail, { className: "h-4 w-4 text-blue-600" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Email" }), _jsx("p", { className: "text-sm text-gray-600", children: 'Brak adresu email' })] })] })] })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "bg-gray-50 rounded-lg p-6", children: _jsxs("div", { className: "flex items-start space-x-3 mb-4", children: [_jsx(Clock, { className: "h-5 w-5 text-gray-400 mt-1" }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-1", children: "Data i czas" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: formatDateTime(appointment.startAt) }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Czas trwania: ", Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / (1000 * 60)), " min"] })] })] }) }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-3", children: "Us\u0142ugi" }), _jsx("div", { className: "space-y-2", children: appointment.serviceNames.map((service, index) => (_jsx("div", { className: "text-sm text-gray-700 bg-white px-3 py-2 rounded border", children: service }, index))) })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Pracownik" }), _jsx("div", { className: "text-sm text-gray-700", children: appointment.staffName })] }), _jsx("div", { className: "bg-gray-50 rounded-lg p-6", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(DollarSign, { className: "h-5 w-5 text-gray-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-semibold text-gray-900", children: formatPrice(typeof appointment.price === 'string' ? parseFloat(appointment.price) : appointment.price, appointment.currency) }), _jsx("p", { className: "text-sm text-gray-500", children: "Cena" })] })] }) }), appointment.notes && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-6", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 mb-2", children: "Notatki" }), _jsx("p", { className: "text-sm text-gray-700 bg-white p-3 rounded border", children: appointment.notes })] })), _jsx("div", { className: "bg-gray-50 rounded-lg p-6", children: _jsx("div", { className: "flex space-x-2 overflow-x-auto", children: statusOptions.map((option) => {
                                                const Icon = option.icon;
                                                const isSelected = appointment.status === option.value;
                                                const isDisabled = saving;
                                                return (_jsxs("button", { onClick: () => !isDisabled && handleStatusChange(option.value), disabled: isDisabled, title: option.label, className: `
                            flex items-center justify-center px-3 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                            ${isSelected
                                                        ? `${option.color} text-white`
                                                        : `bg-gray-400 text-white hover:${option.color.replace('bg-', 'bg-')} hover:opacity-75`}
                            ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            group
                          `, children: [_jsx(Icon, { className: "h-4 w-4 mr-2 md:mr-1" }), _jsx("span", { className: "hidden md:inline", children: option.shortLabel }), _jsx("span", { className: "md:hidden sr-only", children: option.label }), _jsx("span", { className: "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 md:hidden", children: option.label })] }, option.value));
                                            }) }) })] })] })) : (
                    /* Loading state for VIEW mode */
                    _jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600 text-sm", children: "\u0141adowanie szczeg\u00F3\u0142\u00F3w wizyty..." })] }))) : (_jsx("div", { className: "text-center py-8", children: _jsx("p", { className: "text-gray-500", children: "Nieznany tryb" }) })) })), modalSize !== 'minimized' && (_jsxs("div", { className: `flex justify-between border-t border-gray-200 ${modalSize === 'fullscreen' ? 'p-8' : 'p-6'}`, children: [_jsx("div", { className: "flex space-x-3", children: modalMode === 'VIEW' && appointment && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => onModeChange?.('EDIT'), className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Edit3, { className: "h-4 w-4 mr-1" }), " Edytuj"] }), _jsxs("button", { onClick: () => handleAddPayment(), className: "px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center", children: [_jsx(CreditCard, { className: "h-4 w-4 mr-2" }), "P\u0142atno\u015B\u0107"] }), modalMode === 'VIEW' && appointment && (role === 'ADMIN' || role === 'OWNER') && (_jsxs("button", { onClick: handleDeleteAppointment, disabled: saving, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors", title: "Tylko dla administrator\u00F3w - akcja zostanie zapisana w logach", children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), " ", saving ? 'Usuwanie...' : 'Usuń (Admin)'] }))] })) }), _jsxs("div", { className: "flex space-x-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: modalMode === 'VIEW' ? 'Zamknij' : 'Anuluj' }), modalMode === 'CREATE' && (_jsx("button", { onClick: handleCreateAppointment, disabled: saving, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: saving ? 'Zapisywanie...' : 'Utwórz wizytę' })), modalMode === 'EDIT' && (_jsx("button", { onClick: handleUpdateAppointment, disabled: saving, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors", children: saving ? 'Zapisywanie...' : 'Zaktualizuj wizytę' }))] })] }))] }) }));
};
