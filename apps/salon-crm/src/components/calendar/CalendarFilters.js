import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Filter, Users, CheckCircle } from 'lucide-react';
const statusOptions = [
    { value: 'PENDING', label: 'Oczekująca', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'CONFIRMED', label: 'Potwierdzona', color: 'bg-blue-100 text-blue-800' },
    { value: 'COMPLETED', label: 'Zakończona', color: 'bg-green-100 text-green-800' },
    { value: 'CANCELED', label: 'Anulowana', color: 'bg-red-100 text-red-800' }
];
export const CalendarFilters = ({ filters, onFiltersChange, salonId, token }) => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchStaff = async () => {
            if (!salonId || !token)
                return;
            setLoading(true);
            try {
                // Подключение к нашему Staff API через nginx proxy
                const response = await fetch('/api/crm/staff', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (data.success && data.data) {
                    // Преобразуем формат данных для календаря
                    const staffForCalendar = data.data
                        .filter((member) => member.role === 'STAFF_MEMBER')
                        .map((member) => ({
                        id: member.id,
                        name: `${member.firstName} ${member.lastName}`,
                        color: member.color || '#6366f1'
                    }));
                    setStaff(staffForCalendar);
                }
            }
            catch (error) {
                console.error('Failed to fetch staff:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, [salonId, token]);
    const toggleStaff = (staffId) => {
        const newStaffIds = filters.staffIds.includes(staffId)
            ? filters.staffIds.filter(id => id !== staffId)
            : [...filters.staffIds, staffId];
        onFiltersChange({ ...filters, staffIds: newStaffIds });
    };
    const toggleStatus = (status) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        onFiltersChange({ ...filters, statuses: newStatuses });
    };
    const selectAllStaff = () => {
        onFiltersChange({ ...filters, staffIds: (staff || []).map(s => s.id) });
    };
    const clearAllStaff = () => {
        onFiltersChange({ ...filters, staffIds: [] });
    };
    const selectAllStatuses = () => {
        onFiltersChange({ ...filters, statuses: statusOptions.map(s => s.value) });
    };
    const clearAllStatuses = () => {
        onFiltersChange({ ...filters, statuses: [] });
    };
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Filter, { className: "h-5 w-5 text-gray-500" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Filtry" })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "h-4 w-4 text-gray-500" }), _jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Pracownicy" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: selectAllStaff, className: "text-xs text-blue-600 hover:text-blue-800", children: "Wszyscy" }), _jsx("button", { onClick: clearAllStaff, className: "text-xs text-gray-500 hover:text-gray-700", children: "Wyczy\u015B\u0107" })] })] }), loading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => (_jsx("div", { className: "h-8 bg-gray-200 rounded animate-pulse" }, i))) })) : (_jsx("div", { className: "space-y-2", children: (staff || []).map((member) => (_jsxs("label", { className: "flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded", children: [_jsx("input", { type: "checkbox", checked: filters.staffIds.includes(member.id), onChange: () => toggleStaff(member.id), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsxs("div", { className: "flex items-center space-x-2", children: [member.color && (_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: member.color } })), _jsx("span", { className: "text-sm text-gray-900", children: member.name })] })] }, member.id))) }))] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-gray-500" }), _jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Statusy" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("button", { onClick: selectAllStatuses, className: "text-xs text-blue-600 hover:text-blue-800", children: "Wszystkie" }), _jsx("button", { onClick: clearAllStatuses, className: "text-xs text-gray-500 hover:text-gray-700", children: "Wyczy\u015B\u0107" })] })] }), _jsx("div", { className: "space-y-2", children: statusOptions.map((status) => (_jsxs("label", { className: "flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded", children: [_jsx("input", { type: "checkbox", checked: filters.statuses.includes(status.value), onChange: () => toggleStatus(status.value), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: `inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.color}`, children: status.label })] }, status.value))) })] }), (filters.staffIds.length > 0 || filters.statuses.length < statusOptions.length) && (_jsxs("div", { className: "pt-4 border-t border-gray-200", children: [_jsx("div", { className: "text-xs text-gray-500 mb-2", children: "Aktywne filtry:" }), _jsxs("div", { className: "space-y-1 text-xs", children: [filters.staffIds.length > 0 && (_jsxs("div", { children: ["Pracownicy: ", filters.staffIds.length] })), filters.statuses.length < statusOptions.length && (_jsxs("div", { children: ["Statusy: ", filters.statuses.length] }))] })] }))] }));
};
