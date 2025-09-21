import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Card, CardContent, Button } from '@beauty-platform/ui';
import { Plus, Calendar, Clock, User, Search, Eye, Edit, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppointments } from '../hooks/useAppointments';
import { useTenant } from '../contexts/AuthContext';
export default function AppointmentsPage() {
    const { salonId, token } = useTenant();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    // Стабилизируем массив статусов через useMemo
    // Это предотвращает бесконечные циклы useEffect в useAppointments
    const filterStatuses = useMemo(() => statusFilter === 'all' ? ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] : [statusFilter], [statusFilter]);
    // Стабилизируем объект фильтров через useMemo
    // Без этого React будет считать объект новым при каждом рендере
    const appointmentFilters = useMemo(() => ({
        staffIds: [],
        statuses: filterStatuses
    }), [filterStatuses]);
    // Стабилизируем дату через useMemo
    // Убираем фильтр по дате по умолчанию - показываем все записи
    const appointmentDate = useMemo(() => dateFilter ? new Date(dateFilter) : undefined, [dateFilter]);
    const { appointments, loading, error, refresh } = useAppointments({
        date: appointmentDate,
        view: 'month',
        filters: appointmentFilters,
        salonId: salonId || undefined,
        token: token || undefined
    });
    const handleStatusChange = (status) => {
        setStatusFilter(status);
    };
    const handleSearch = (query) => {
        setSearchQuery(query);
    };
    const filteredAppointments = appointments?.filter(appointment => {
        const matchesSearch = !searchQuery ||
            appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            appointment.serviceNames.some(service => service.toLowerCase().includes(searchQuery.toLowerCase())) ||
            appointment.staffName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }) || [];
    const formatDateTime = (datetime) => {
        return new Date(datetime).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'IN_PROGRESS':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'CANCELED':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING':
                return 'Ожидает';
            case 'CONFIRMED':
                return 'Подтверждена';
            case 'IN_PROGRESS':
                return 'Выполняется';
            case 'COMPLETED':
                return 'Завершена';
            case 'CANCELED':
                return 'Отменена';
            default:
                return status;
        }
    };
    const handleViewAppointment = (appointmentId) => {
        navigate(`/appointments/${appointmentId}`);
    };
    const handleEditAppointment = (appointmentId) => {
        navigate(`/appointments/${appointmentId}/edit`);
    };
    const openNewAppointment = () => {
        navigate('/appointments/new');
    };
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u0417\u0430\u043F\u0438\u0441\u0438" }), _jsxs("p", { className: "text-gray-600 mt-1", children: ["\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u044F\u043C\u0438 \u0441\u0430\u043B\u043E\u043D\u0430 (", filteredAppointments.length, " \u0437\u0430\u043F\u0438\u0441\u0435\u0439)"] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { onClick: refresh, variant: "outline", disabled: loading, className: "flex items-center", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}` }), "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C"] }), _jsxs(Button, { onClick: openNewAppointment, className: "bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C"] })] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0443, \u0443\u0441\u043B\u0443\u0433\u0435 \u0438\u043B\u0438 \u043C\u0430\u0441\u0442\u0435\u0440\u0443...", value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsx("div", { className: "w-full lg:w-48", children: _jsx("input", { type: "date", value: dateFilter, onChange: (e) => setDateFilter(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" }) }), _jsx("div", { className: "w-full lg:w-48", children: _jsxs("select", { value: statusFilter, onChange: (e) => handleStatusChange(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B" }), _jsx("option", { value: "PENDING", children: "\u041E\u0436\u0438\u0434\u0430\u0435\u0442" }), _jsx("option", { value: "CONFIRMED", children: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0430" }), _jsx("option", { value: "IN_PROGRESS", children: "\u0412\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442\u0441\u044F" }), _jsx("option", { value: "COMPLETED", children: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430" }), _jsx("option", { value: "CANCELED", children: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u0430" })] }) })] }) }) }), loading && (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-500" }), _jsx("span", { className: "ml-2 text-gray-600", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0435\u0439..." })] })), error && (_jsx("div", { className: "flex items-center justify-center py-12 text-center", children: _jsxs("div", { children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438" }), _jsx("p", { className: "text-red-600 mb-4", children: error }), _jsx(Button, { onClick: refresh, variant: "outline", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] }) })), !loading && !error && filteredAppointments.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsxs("div", { className: "max-w-sm mx-auto", children: [_jsx("div", { className: "bg-gray-100 rounded-full p-8 mb-4 mx-auto w-32 h-32 flex items-center justify-center", children: _jsx(Calendar, { className: "h-12 w-12 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: searchQuery ? 'Записи не найдены' : 'Нет записей' }), _jsx("p", { className: "text-gray-600 mb-6", children: searchQuery
                                    ? `По запросу "${searchQuery}" ничего не найдено`
                                    : 'Создайте первую запись для начала работы' }), !searchQuery && (_jsxs(Button, { onClick: openNewAppointment, className: "bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043F\u0438\u0441\u044C"] }))] }) })), !loading && !error && filteredAppointments.length > 0 && (_jsx("div", { className: "space-y-4", children: filteredAppointments.map((appointment) => (_jsx(Card, { className: "hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center space-x-3 mb-2", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: appointment.clientName }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(appointment.status)}`, children: getStatusLabel(appointment.status) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Calendar, { className: "w-4 h-4" }), _jsx("span", { children: formatDateTime(appointment.startAt) })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(User, { className: "w-4 h-4" }), _jsx("span", { children: appointment.staffName })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-4 h-4" }), _jsxs("span", { children: [Math.round((new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime()) / (1000 * 60)), " \u043C\u0438\u043D"] })] })] }), _jsx("div", { className: "mt-2", children: _jsx("div", { className: "flex flex-wrap gap-2", children: appointment.serviceNames.map((service, index) => (_jsx("span", { className: "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded", children: service }, index))) }) }), appointment.notes && (_jsx("div", { className: "mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700", children: appointment.notes }))] }), _jsx("div", { className: "text-right", children: _jsx("div", { className: "text-lg font-bold text-gray-900", children: new Intl.NumberFormat('pl-PL', {
                                                            style: 'currency',
                                                            currency: appointment.currency || 'PLN'
                                                        }).format(Number(appointment.price) || 0) }) })] }) }), _jsxs("div", { className: "flex flex-col space-y-2 ml-4", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleViewAppointment(appointment.id), children: [_jsx(Eye, { className: "w-4 h-4 mr-1" }), "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleEditAppointment(appointment.id), children: [_jsx(Edit, { className: "w-4 h-4 mr-1" }), "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"] })] })] }) }) }, appointment.id))) }))] }) }));
}
