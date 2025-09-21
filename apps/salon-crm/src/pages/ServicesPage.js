import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { Plus, Search, Edit3, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
import { useServices } from '../hooks/useServices';
export default function ServicesPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const { services, loading, error, searchServices, deleteService } = useServices();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(services);
    const [showFilters, setShowFilters] = useState(false);
    const [priceFilter, setPriceFilter] = useState('all');
    const [durationFilter, setDurationFilter] = useState('all');
    // Функция фильтрации услуг
    const applyFilters = (servicesList) => {
        let filtered = [...servicesList];
        // Фильтр по цене
        if (priceFilter !== 'all') {
            filtered = filtered.filter(service => {
                const price = Number(service.price);
                switch (priceFilter) {
                    case 'low': return price < 50;
                    case 'medium': return price >= 50 && price <= 150;
                    case 'high': return price > 150;
                    default: return true;
                }
            });
        }
        // Фильтр по длительности
        if (durationFilter !== 'all') {
            filtered = filtered.filter(service => {
                const duration = service.duration;
                switch (durationFilter) {
                    case 'short': return duration <= 30;
                    case 'medium': return duration > 30 && duration <= 90;
                    case 'long': return duration > 90;
                    default: return true;
                }
            });
        }
        return filtered;
    };
    // Обновляем результаты при изменении услуг или фильтров
    useEffect(() => {
        let baseServices = services;
        // Если есть поиск, сначала выполняем поиск асинхронно
        if (searchQuery.trim()) {
            searchServices(searchQuery).then(searchResults => {
                const filteredResults = applyFilters(searchResults);
                setSearchResults(filteredResults);
            });
        }
        else {
            // Если поиска нет, применяем фильтры к всем услугам
            const filteredServices = applyFilters(baseServices);
            setSearchResults(filteredServices);
        }
    }, [services, priceFilter, durationFilter]);
    // Отдельный useEffect для поиска
    useEffect(() => {
        if (!searchQuery.trim()) {
            // Если поиск очищен, показываем все услуги с фильтрами
            const filteredServices = applyFilters(services);
            setSearchResults(filteredServices);
        }
    }, [searchQuery, services]);
    // Обработка поиска
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await searchServices(query);
            setSearchResults(results);
        }
        else {
            setSearchResults(services);
        }
    };
    // Обработка удаления услуги
    const handleDelete = async (serviceId, serviceName) => {
        if (window.confirm(`Вы уверены, что хотите удалить услугу "${serviceName}"?`)) {
            try {
                await deleteService(serviceId);
                // Обновляем результаты поиска после удаления
                if (searchQuery) {
                    handleSearch(searchQuery);
                }
            }
            catch (error) {
                console.error('Ошибка при удалении услуги:', error);
                alert('Ошибка при удалении услуги');
            }
        }
    };
    const displayServices = searchQuery ? searchResults : services;
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u0423\u0441\u043B\u0443\u0433\u0438" }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0430\u043C\u0438 \u0441\u0430\u043B\u043E\u043D\u0430" })] }), _jsxs(Button, { onClick: () => navigate('/services/create'), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443"] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx("input", { type: "text", placeholder: "\u041F\u043E\u0438\u0441\u043A \u0443\u0441\u043B\u0443\u0433...", value: searchQuery, onChange: (e) => handleSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] }), _jsxs(Button, { variant: "outline", onClick: () => setShowFilters(!showFilters), className: showFilters ? 'bg-blue-50 border-blue-300' : '', children: ["\u0424\u0438\u043B\u044C\u0442\u0440\u044B ", (priceFilter !== 'all' || durationFilter !== 'all') && '•'] })] }) }) }), showFilters && (_jsx(Card, { className: "mb-6", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\u0426\u0435\u043D\u0430" }), _jsxs("select", { value: priceFilter, onChange: (e) => setPriceFilter(e.target.value), className: "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "\u0412\u0441\u0435 \u0446\u0435\u043D\u044B" }), _jsx("option", { value: "low", children: "\u0414\u043E 50 \u20B4" }), _jsx("option", { value: "medium", children: "50-150 \u20B4" }), _jsx("option", { value: "high", children: "\u0421\u0432\u044B\u0448\u0435 150 \u20B4" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C" }), _jsxs("select", { value: durationFilter, onChange: (e) => setDurationFilter(e.target.value), className: "w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", children: [_jsx("option", { value: "all", children: "\u041B\u044E\u0431\u0430\u044F \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C" }), _jsx("option", { value: "short", children: "\u0414\u043E 30 \u043C\u0438\u043D" }), _jsx("option", { value: "medium", children: "30-90 \u043C\u0438\u043D" }), _jsx("option", { value: "long", children: "\u0421\u0432\u044B\u0448\u0435 90 \u043C\u0438\u043D" })] })] })] }), (priceFilter !== 'all' || durationFilter !== 'all') && (_jsx("div", { className: "mt-4 pt-4 border-t", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                        setPriceFilter('all');
                                        setDurationFilter('all');
                                    }, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440\u044B" }) }))] }) })), loading ? (_jsxs("div", { className: "flex justify-center items-center py-12", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-600" }), _jsx("span", { className: "ml-2 text-gray-600", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0443\u0441\u043B\u0443\u0433..." })] })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsxs("p", { className: "text-red-600 mb-4", children: ["\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0443\u0441\u043B\u0443\u0433: ", error] }), _jsx(Button, { onClick: () => window.location.reload(), children: "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })] })) : services.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "\u0423\u0441\u043B\u0443\u0433\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), _jsxs(Button, { onClick: () => navigate('/services/create'), children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0435\u0440\u0432\u0443\u044E \u0443\u0441\u043B\u0443\u0433\u0443"] })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: displayServices.map((service) => (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: service.name }), service.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: service.description }))] }), _jsxs("div", { className: "flex space-x-1", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => navigate(`/services/${service.id}/edit`), children: _jsx(Edit3, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDelete(service.id, service.name), children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C:" }), _jsxs("span", { className: "text-sm font-medium", children: [service.duration, " \u043C\u0438\u043D"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C:" }), _jsx("span", { className: "text-lg font-bold text-green-600", children: formatPrice(Number(service.price)) })] })] }) })] }, service.id))) }))] }) }));
}
