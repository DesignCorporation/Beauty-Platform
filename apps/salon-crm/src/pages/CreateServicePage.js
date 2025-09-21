import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
import { useServices } from '../hooks/useServices';
export default function CreateServicePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { formatPrice } = useCurrency();
    const { createService } = useServices();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: '',
        price: ''
    });
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createService({
                name: formData.name,
                description: formData.description,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price)
            });
            navigate('/services');
        }
        catch (error) {
            console.error('Ошибка при создании услуги:', error);
            alert('Ошибка при создании услуги');
        }
        finally {
            setLoading(false);
        }
    };
    const isFormValid = formData.name && formData.duration && formData.price;
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("div", { className: "flex items-center justify-between mb-8", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Button, { variant: "outline", onClick: () => navigate('/services'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\u041D\u0430\u0437\u0430\u0434 \u043A \u0443\u0441\u043B\u0443\u0433\u0430\u043C"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443" }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u043E\u0432\u043E\u0439 \u0443\u0441\u043B\u0443\u0433\u0438 \u0432 \u043A\u0430\u0442\u0430\u043B\u043E\u0433" })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E\u0431 \u0443\u0441\u043B\u0443\u0433\u0435" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 *" }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleInputChange, required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0421\u0442\u0440\u0438\u0436\u043A\u0430 \u0436\u0435\u043D\u0441\u043A\u0430\u044F" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-gray-700 mb-2", children: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433\u0438..." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "duration", className: "block text-sm font-medium text-gray-700 mb-2", children: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C (\u043C\u0438\u043D) *" }), _jsx("input", { type: "number", id: "duration", name: "duration", value: formData.duration, onChange: handleInputChange, required: true, min: "1", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "60" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "price", className: "block text-sm font-medium text-gray-700 mb-2", children: "\u0426\u0435\u043D\u0430 *" }), _jsx("input", { type: "number", id: "price", name: "price", value: formData.price, onChange: handleInputChange, required: true, min: "0", step: "0.01", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "1500.00" })] })] }), isFormValid && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440:" }), _jsxs("div", { className: "bg-white p-4 rounded border", children: [_jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsx("h4", { className: "font-semibold text-gray-900", children: formData.name }), formData.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: formData.description }))] }) }), _jsxs("div", { className: "mt-3 space-y-1", children: [_jsxs("div", { className: "flex justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C:" }), _jsxs("span", { className: "font-medium", children: [formData.duration, " \u043C\u0438\u043D"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600 text-sm", children: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C:" }), _jsx("span", { className: "text-lg font-bold text-green-600", children: formatPrice(Number(formData.price)) })] })] })] })] })), _jsxs("div", { className: "flex justify-end space-x-4 pt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => navigate('/services'), disabled: loading, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", disabled: !isFormValid || loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0443\u0441\u043B\u0443\u0433\u0443"] })) })] })] }) })] })] }) }));
}
