import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Plus, Search, Phone, Mail, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { useAuthContext } from '../contexts/AuthContext';
export default function ClientsPage() {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const { clients, loading, error, createClient, deleteClient, searchClients } = useClients();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(clients);
    // Обновляем результаты поиска при изменении клиентов
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults(clients);
        }
    }, [clients, searchQuery]);
    // Обработка поиска
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await searchClients(query);
            setSearchResults(results);
        }
        else {
            setSearchResults(clients);
        }
    };
    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString)
            return 'Не записан';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };
    const displayClients = searchQuery ? searchResults : clients;
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u041A\u043B\u0438\u0435\u043D\u0442\u044B" }), _jsxs("p", { className: "text-gray-600 mt-1", children: ["\u0411\u0430\u0437\u0430 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 \u0441\u0430\u043B\u043E\u043D\u0430 (", clients.length, " \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432)"] })] }), _jsxs(Button, { onClick: () => navigate('/clients/create'), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430"] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 \u043F\u043E \u0438\u043C\u0435\u043D\u0438, email \u0438\u043B\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443...", value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsx(Button, { variant: "outline", children: "\u0424\u0438\u043B\u044C\u0442\u0440\u044B" })] }) }) }), loading && (_jsxs("div", { className: "flex items-center justify-center py-12", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-gray-500" }), _jsx("span", { className: "ml-2 text-gray-600", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432..." })] })), error && (_jsx("div", { className: "flex items-center justify-center py-12 text-center", children: _jsxs("div", { children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438" }), _jsx("p", { className: "text-red-600 mb-4", children: error }), _jsx(Button, { onClick: () => window.location.reload(), variant: "outline", children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] }) })), !loading && !error && displayClients.length === 0 && (_jsx("div", { className: "text-center py-12", children: _jsxs("div", { className: "max-w-sm mx-auto", children: [_jsx("div", { className: "bg-gray-100 rounded-full p-8 mb-4 mx-auto w-32 h-32 flex items-center justify-center", children: _jsx(Phone, { className: "h-12 w-12 text-gray-400" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: searchQuery ? 'Клиенты не найдены' : 'Нет клиентов' }), _jsx("p", { className: "text-gray-600 mb-6", children: searchQuery
                                    ? `По запросу "${searchQuery}" ничего не найдено`
                                    : 'Добавьте первого клиента для начала работы' }), !searchQuery && (_jsxs(Button, { onClick: () => navigate('/clients/create'), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430"] }))] }) })), !loading && !error && displayClients.length > 0 && (_jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: displayClients.map((client) => (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-xl", children: client.name }), _jsxs("div", { className: "flex flex-col mt-2 space-y-1 text-sm text-gray-600", children: [client.phone && (_jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), client.phone] })), client.email && (_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), client.email] }))] })] }), _jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx(Button, { size: "sm", onClick: () => navigate(`/clients/${client.id}/edit`), children: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }), _jsx("div", { className: `px-2 py-1 text-xs rounded-full text-center ${client.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}`, children: client.status === 'ACTIVE' ? 'Активен' : 'Неактивен' })] })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 text-center mb-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-lg font-bold text-gray-600", children: formatDate(client.createdAt) }), _jsx("div", { className: "text-xs text-gray-500", children: "\u0414\u0430\u0442\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-lg font-bold text-blue-600", children: "0" }), _jsx("div", { className: "text-xs text-gray-500", children: "\u0412\u0438\u0437\u0438\u0442\u043E\u0432" })] })] }), client.notes && (_jsx("div", { className: "mb-4 p-3 bg-gray-50 rounded-lg", children: _jsx("p", { className: "text-sm text-gray-700", children: client.notes }) })), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C"] }), client.phone && (_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), "\u041F\u043E\u0437\u0432\u043E\u043D\u0438\u0442\u044C"] }))] })] })] }, client.id))) }))] }) }));
}
