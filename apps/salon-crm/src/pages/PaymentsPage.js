import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Download, Filter, CreditCard, TrendingUp } from 'lucide-react';
export default function PaymentsPage() {
    const demoPayments = [
        {
            id: '1',
            clientName: 'Анна Иванова',
            amount: 28,
            service: 'Маникюр классический',
            date: '2025-08-15',
            time: '10:30',
            method: 'Карта',
            status: 'Завершен',
        },
        {
            id: '2',
            clientName: 'Елена Петрова',
            amount: 33,
            service: 'Стрижка женская',
            date: '2025-08-15',
            time: '14:00',
            method: 'Наличные',
            status: 'Завершен',
        },
        {
            id: '3',
            clientName: 'Мария Сидорова',
            amount: 89,
            service: 'Окрашивание волос',
            date: '2025-08-14',
            time: '11:00',
            method: 'Карта',
            status: 'Ожидает',
        },
    ];
    const totalToday = demoPayments
        .filter(p => p.date === '2025-08-15')
        .reduce((sum, p) => sum + p.amount, 0);
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u041F\u043B\u0430\u0442\u0435\u0436\u0438" }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u0424\u0438\u043D\u0430\u043D\u0441\u043E\u0432\u044B\u0435 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438 \u0441\u0430\u043B\u043E\u043D\u0430" })] }), _jsxs(Button, { children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u043E\u0442\u0447\u0435\u0442\u0430"] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8", children: [_jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium text-gray-600 flex items-center", children: [_jsx(CreditCard, { className: "w-4 h-4 mr-2" }), "\u0421\u0435\u0433\u043E\u0434\u043D\u044F"] }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["\u20AC", totalToday.toLocaleString()] })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium text-gray-600 flex items-center", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-2" }), "\u0417\u0430 \u043D\u0435\u0434\u0435\u043B\u044E"] }), _jsx("div", { className: "text-2xl font-bold text-blue-600", children: "\u20AC539" })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsxs(CardTitle, { className: "text-sm font-medium text-gray-600 flex items-center", children: [_jsx(TrendingUp, { className: "w-4 h-4 mr-2" }), "\u0417\u0430 \u043C\u0435\u0441\u044F\u0446"] }), _jsx("div", { className: "text-2xl font-bold text-purple-600", children: "\u20AC2,081" })] }) }), _jsx(Card, { children: _jsxs(CardHeader, { className: "pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium text-gray-600", children: "\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0447\u0435\u043A" }), _jsx("div", { className: "text-2xl font-bold text-amber-600", children: "\u20AC47" })] }) })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("select", { className: "px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { children: "\u0412\u0441\u0435 \u043F\u0435\u0440\u0438\u043E\u0434\u044B" }), _jsx("option", { children: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F" }), _jsx("option", { children: "\u041D\u0435\u0434\u0435\u043B\u044F" }), _jsx("option", { children: "\u041C\u0435\u0441\u044F\u0446" })] }), _jsxs("select", { className: "px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { children: "\u0412\u0441\u0435 \u043C\u0435\u0442\u043E\u0434\u044B" }), _jsx("option", { children: "\u041A\u0430\u0440\u0442\u0430" }), _jsx("option", { children: "\u041D\u0430\u043B\u0438\u0447\u043D\u044B\u0435" }), _jsx("option", { children: "\u041F\u0435\u0440\u0435\u0432\u043E\u0434" })] })] }), _jsxs(Button, { variant: "outline", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "\u0424\u0438\u043B\u044C\u0442\u0440\u044B"] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u041A\u043B\u0438\u0435\u043D\u0442" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u0423\u0441\u043B\u0443\u0433\u0430" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u0421\u0443\u043C\u043C\u0430" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u0421\u043F\u043E\u0441\u043E\u0431" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u0414\u0430\u0442\u0430" }), _jsx("th", { className: "text-left py-3 px-4 font-medium text-gray-600", children: "\u0421\u0442\u0430\u0442\u0443\u0441" })] }) }), _jsx("tbody", { children: demoPayments.map((payment) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "py-3 px-4", children: _jsx("div", { className: "font-medium", children: payment.clientName }) }), _jsx("td", { className: "py-3 px-4 text-gray-600", children: payment.service }), _jsx("td", { className: "py-3 px-4", children: _jsxs("span", { className: "font-bold text-green-600", children: ["\u20AC", payment.amount] }) }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: "px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800", children: payment.method }) }), _jsxs("td", { className: "py-3 px-4 text-gray-600", children: [payment.date, " ", payment.time] }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${payment.status === 'Завершен'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'}`, children: payment.status }) })] }, payment.id))) })] }) }) })] })] }) }));
}
