import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, Filter } from 'lucide-react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { StaffCalendarGrid } from '../components/calendar/StaffCalendarGrid';
import { FiltersModal } from '../components/calendar/FiltersModal';
import { useAppointments } from '../hooks/useAppointments';
import { useStaff } from '../hooks/useStaff';
import { useTenant } from '../contexts/AuthContext';
// Note: Removed demo appointments - now using only real data from API
export default function CalendarPage() {
    const navigate = useNavigate();
    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(() => {
        // Start with current date instead of hardcoded demo date
        return new Date(); // Current date - FIXED: was hardcoded to 2025-08-25
    });
    const [filters, setFilters] = useState({
        staffIds: [],
        statuses: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] // Обновлено под реальные статусы API
    });
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const { salonId, token } = useTenant();
    const { appointments, loading, error, rescheduleAppointment, refetch } = useAppointments({
        date: currentDate,
        view,
        filters,
        salonId,
        token
    });
    const { staff, loading: staffLoading, error: staffError } = useStaff();
    // FIXED: Use only real appointments from API for ALL calendar views
    const allAppointments = appointments || [];
    // Debug log to track data sync issues
    console.log(`[CalendarPage] Loading appointments for ${view} view:`, {
        appointmentsCount: allAppointments.length,
        currentDate: currentDate.toISOString(),
        salonId,
        filters,
        loading,
        error,
        appointments: allAppointments.slice(0, 3) // Show first 3 appointments for debugging
    });
    // Keep calendar on current month - no auto-switching to demo data
    // Users can manually navigate to months with demo data if needed
    const navigateDate = (direction) => {
        switch (view) {
            case 'day':
                setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
                break;
            case 'week':
                setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
                break;
            case 'month':
                setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
                break;
            default:
                break;
        }
    };
    const getDateTitle = () => {
        switch (view) {
            case 'day':
                return format(currentDate, 'EEEE, d MMMM yyyy');
            case 'week':
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                return format(weekStart, 'MMMM yyyy');
            case 'month':
                return format(currentDate, 'MMMM yyyy');
            default:
                return format(currentDate, 'MMMM yyyy');
        }
    };
    const roundTimeToQuarterHour = (value) => {
        const rounded = new Date(value);
        const minutes = rounded.getMinutes();
        const remainder = minutes % 15;
        if (remainder !== 0) {
            const increment = 15 - remainder;
            rounded.setMinutes(minutes + increment, 0, 0);
        }
        else {
            rounded.setSeconds(0, 0);
        }
        return rounded;
    };
    const handleSlotClick = (datetime) => {
        // Navigate to new appointment form with pre-filled date/time
        const roundedDate = roundTimeToQuarterHour(datetime);
        const dateStr = roundedDate.toISOString().split('T')[0];
        const timeStr = roundedDate.toTimeString().slice(0, 5);
        navigate(`/appointments/new?date=${dateStr}&time=${timeStr}`);
    };
    const handleAppointmentClick = (appointmentId, mode = 'VIEW') => {
        console.log('[CalendarPage] Appointment clicked:', { appointmentId, mode });
        if (mode === 'EDIT') {
            navigate(`/appointments/${appointmentId}/edit`);
        }
        else {
            navigate(`/appointments/${appointmentId}`);
        }
    };
    const openNewAppointment = () => {
        navigate('/appointments/new');
    };
    // Removed unused function
    const handleViewChange = (newView) => {
        setView(newView);
        // Smart date switching logic can be added here if needed
    };
    return (_jsxs("div", { className: "h-full flex flex-col", children: [error && (_jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800 mb-1", children: "Nie uda\u0142o si\u0119 za\u0142adowa\u0107 wizyt" }), _jsxs("p", { className: "text-sm text-red-600 mb-3", children: [error, ". Kalendarz dzia\u0142a w trybie offline."] }), _jsx("button", { onClick: () => refetch(), className: "text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors", children: "Spr\u00F3buj ponownie" })] })] })), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4 mb-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("button", { onClick: () => navigateDate('prev'), className: "px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center", children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx("div", { className: "flex items-center space-x-3", children: _jsx("h2", { className: "text-xl font-bold text-gray-900", children: getDateTitle() }) }), _jsx("button", { onClick: () => navigateDate('next'), className: "px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center", children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("button", { onClick: () => setShowFiltersModal(true), className: `px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${(filters.staffIds.length > 0 || filters.statuses.length < 4)
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: [_jsx(Filter, { className: "h-4 w-4" }), _jsx("span", { children: "Filtry" }), (filters.staffIds.length > 0 || filters.statuses.length < 4) && (_jsx("span", { className: "bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: filters.staffIds.length + (filters.statuses.length < 4 ? 1 : 0) }))] }), _jsx("button", { onClick: () => handleViewChange('day'), className: `px-3 py-2 text-sm rounded-lg transition-colors ${view === 'day'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: "Dzie\u0144" }), _jsx("button", { onClick: () => handleViewChange('week'), className: `px-3 py-2 text-sm rounded-lg transition-colors ${view === 'week'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: "Tydzie\u0144" }), _jsx("button", { onClick: () => handleViewChange('month'), className: `px-3 py-2 text-sm rounded-lg transition-colors ${view === 'month'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: "Miesi\u0105c" }), _jsx("button", { onClick: () => handleViewChange('staff'), className: `px-3 py-2 text-sm rounded-lg transition-colors ${view === 'staff'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: "\u041F\u043E \u043C\u0430\u0441\u0442\u0435\u0440\u0430\u043C" }), _jsxs("button", { onClick: openNewAppointment, className: "px-3 py-2 text-sm rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2", children: [_jsx(Plus, { className: "h-4 w-4" }), _jsx("span", { children: "Nowa wizyta" })] })] })] }) }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx("div", { className: "calendar-grid h-full", children: view === 'staff' ? (_jsx(StaffCalendarGrid, { appointments: allAppointments, staff: staff, selectedDate: currentDate, view: "week", onAppointmentClick: (appointment) => handleAppointmentClick(appointment.id, 'VIEW'), onTimeSlotClick: (staffId, datetime) => {
                            // Создание новой записи для конкретного мастера и времени
                            navigate('/appointments/new', {
                                state: {
                                    staffId,
                                    startTime: datetime.toISOString()
                                }
                            });
                        } })) : (_jsx(CalendarGrid, { view: view, currentDate: currentDate, appointments: allAppointments, onAppointmentClick: (id) => handleAppointmentClick(id, 'VIEW'), onSlotClick: handleSlotClick, onAppointmentDrop: rescheduleAppointment, onDateNavigation: setCurrentDate, loading: loading, staffFilter: filters.staffIds })) }) }), _jsx(FiltersModal, { isOpen: showFiltersModal, onClose: () => setShowFiltersModal(false), filters: filters, onFiltersChange: setFilters, salonId: salonId, token: token })] }));
}
