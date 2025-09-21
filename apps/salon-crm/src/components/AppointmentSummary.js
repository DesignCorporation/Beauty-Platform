import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { Calendar, Clock, User, Briefcase, DollarSign, CheckCircle, Timer, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
// Цветная система статусов как в старом проекте
const statusOptions = [
    {
        value: 'PENDING',
        label: 'Oczekująca',
        shortLabel: 'Oczek.',
        colorLight: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: Timer
    },
    {
        value: 'CONFIRMED',
        label: 'Potwierdzona',
        shortLabel: 'Potw.',
        colorLight: 'bg-blue-50 border-blue-200 text-blue-800',
        icon: CheckCircle2
    },
    {
        value: 'COMPLETED',
        label: 'Zakończona',
        shortLabel: 'Zak.',
        colorLight: 'bg-green-50 border-green-200 text-green-800',
        icon: CheckCircle
    },
    {
        value: 'CANCELED',
        label: 'Anulowana',
        shortLabel: 'Anul.',
        colorLight: 'bg-red-50 border-red-200 text-red-800',
        icon: XCircle
    }
];
// Функция для получения цветов статуса
const getStatusStyles = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption || statusOptions[1]; // fallback на CONFIRMED
};
export const AppointmentSummary = ({ selectedClient, selectedServices, selectedStaff, date, startTime, endTime, totalPrice, totalDuration, status }) => {
    const formatDateTimeDisplay = (date, time) => {
        if (!date || !time)
            return '';
        try {
            const dateObj = new Date(`${date}T${time}`);
            return format(dateObj, 'EEEE, d MMMM yyyy • HH:mm');
        }
        catch {
            return `${date} • ${time}`;
        }
    };
    const formatPrice = (price, currency = 'PLN') => {
        return new Intl.NumberFormat('pl-PL', {
            style: 'currency',
            currency: currency
        }).format(price);
    };
    return (_jsxs(Card, { className: "bg-gray-50 border-gray-200", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center text-gray-900", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-2 text-green-600" }), "Podsumowanie wizyty"] }) }), _jsxs(CardContent, { className: "space-y-6", children: [selectedClient && (_jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-500 mb-1 flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-1" }), "Klient"] }), _jsx("div", { className: "font-medium text-gray-900", children: selectedClient.name }), selectedClient.phone && (_jsx("div", { className: "text-sm text-gray-600", children: selectedClient.phone }))] })), selectedServices.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-500 mb-2 flex items-center", children: [_jsx(Briefcase, { className: "w-4 h-4 mr-1" }), "Us\u0142ugi (", selectedServices.length, ")"] }), _jsx("div", { className: "space-y-2", children: selectedServices.map((service) => (_jsxs("div", { className: "flex justify-between items-start text-sm bg-white rounded-lg p-3 border border-gray-100", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-gray-900", children: service.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [service.duration, " min"] })] }), _jsx("div", { className: "font-semibold text-gray-900", children: formatPrice(service.price || 0, 'PLN') })] }, service.id))) })] })), selectedStaff && (_jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-500 mb-1 flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-1" }), "Pracownik"] }), _jsx("div", { className: "font-medium text-gray-900", children: selectedStaff.name }), _jsx("div", { className: "text-sm text-gray-600", children: selectedStaff.role === 'STAFF_MEMBER' ? 'Мастер' : selectedStaff.role })] })), date && startTime && (_jsxs("div", { children: [_jsxs("div", { className: "text-sm text-gray-500 mb-1 flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-1" }), "Data i czas"] }), _jsx("div", { className: "font-medium text-gray-900", children: formatDateTimeDisplay(date, startTime) }), endTime !== startTime && (_jsxs("div", { className: "text-sm text-gray-600 flex items-center mt-1", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), startTime, " - ", endTime, " (", totalDuration, " min)"] }))] })), status && (_jsxs("div", { children: [_jsx("div", { className: "text-sm text-gray-500 mb-2", children: "Status" }), _jsxs("div", { className: `inline-flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusStyles(status).colorLight}`, children: [React.createElement(getStatusStyles(status).icon, { className: "w-4 h-4" }), _jsx("span", { children: getStatusStyles(status).label })] })] })), (totalPrice > 0 || totalDuration > 0) && (_jsx("div", { className: "border-t border-gray-200 pt-4", children: _jsxs("div", { className: "space-y-2", children: [totalDuration > 0 && (_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "\u0141\u0105czny czas:" }), _jsxs("span", { className: "font-medium text-gray-900", children: [totalDuration, " min"] })] })), totalPrice > 0 && (_jsxs("div", { className: "flex justify-between text-lg font-bold", children: [_jsxs("span", { className: "text-gray-900 flex items-center", children: [_jsx(DollarSign, { className: "w-5 h-5 mr-1" }), "Razem:"] }), _jsx("span", { className: "text-green-600", children: formatPrice(totalPrice) })] }))] }) })), !selectedClient && selectedServices.length === 0 && !selectedStaff && (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(CheckCircle, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-sm", children: "Wybierz klienta, us\u0142ugi i pracownika" }), _jsx("p", { className: "text-xs", children: "aby zobaczy\u0107 podsumowanie" })] }))] })] }));
};
