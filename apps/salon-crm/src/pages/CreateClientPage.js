import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@beauty-platform/ui';
import { ArrowLeft, Save, Loader2, User, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClients } from '../hooks/useClients';
export default function CreateClientPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { createClient } = useClients();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        notes: '',
        birthday: ''
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
            await createClient({
                name: formData.name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                notes: formData.notes || undefined,
                birthday: formData.birthday || undefined
            });
            navigate('/clients');
        }
        catch (error) {
            console.error('Ошибка при создании клиента:', error);
            alert('Ошибка при создании клиента');
        }
        finally {
            setLoading(false);
        }
    };
    const isFormValid = formData.name.trim() !== '';
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("div", { className: "flex items-center justify-between mb-8", children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Button, { variant: "outline", onClick: () => navigate('/clients'), children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\u041D\u0430\u0437\u0430\u0434 \u043A \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C"] }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044F \u043D\u043E\u0432\u043E\u0433\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430" })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(User, { className: "w-5 h-5 mr-2" }), "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0435"] }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 border-b pb-2", children: "\u041E\u0441\u043D\u043E\u0432\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(User, { className: "w-4 h-4 inline mr-1" }), "\u041F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F *"] }), _jsx("input", { type: "text", id: "name", name: "name", value: formData.name, onChange: handleInputChange, required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0418\u0432\u0430\u043D\u043E\u0432\u0430 \u0410\u043D\u043D\u0430 \u0421\u0435\u0440\u0433\u0435\u0435\u0432\u043D\u0430" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Mail, { className: "w-4 h-4 inline mr-1" }), "Email"] }), _jsx("input", { type: "email", id: "email", name: "email", value: formData.email, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "anna@example.com" })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Phone, { className: "w-4 h-4 inline mr-1" }), "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"] }), _jsx("input", { type: "tel", id: "phone", name: "phone", value: formData.phone, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "+7 (999) 123-45-67" })] })] }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "birthday", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(Calendar, { className: "w-4 h-4 inline mr-1" }), "\u0414\u0435\u043D\u044C \u0440\u043E\u0436\u0434\u0435\u043D\u0438\u044F"] }), _jsx("input", { type: "date", id: "birthday", name: "birthday", value: formData.birthday, onChange: handleInputChange, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent" })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 border-b pb-2", children: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F" }), _jsxs("div", { children: [_jsxs("label", { htmlFor: "notes", className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(FileText, { className: "w-4 h-4 inline mr-1" }), "\u0417\u0430\u043C\u0435\u0442\u043A\u0438"] }), _jsx("textarea", { id: "notes", name: "notes", value: formData.notes, onChange: handleInputChange, rows: 3, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent", placeholder: "\u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0442\u0435\u043D\u0438\u044F, \u0430\u043B\u043B\u0435\u0440\u0433\u0438\u0438, \u043E\u0441\u043E\u0431\u044B\u0435 \u043F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u044F..." })] })] }), isFormValid && (_jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [_jsx("h3", { className: "text-sm font-medium text-gray-700 mb-2", children: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440:" }), _jsx("div", { className: "bg-white p-4 rounded border", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-gray-900", children: formData.name }), _jsxs("div", { className: "mt-2 space-y-1 text-sm text-gray-600", children: [formData.email && (_jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), formData.email] })), formData.phone && (_jsxs("div", { className: "flex items-center", children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), formData.phone] })), formData.birthday && (_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "w-4 h-4 mr-2" }), new Date(formData.birthday).toLocaleDateString('ru-RU')] }))] }), formData.notes && (_jsxs("div", { className: "mt-2 p-2 bg-gray-50 rounded text-sm", children: [_jsx("strong", { children: "\u0417\u0430\u043C\u0435\u0442\u043A\u0438:" }), " ", formData.notes] }))] }) }) })] })), _jsxs("div", { className: "flex justify-end space-x-4 pt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => navigate('/clients'), disabled: loading, children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", disabled: !isFormValid || loading, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435..."] })) : (_jsxs(_Fragment, { children: [_jsx(Save, { className: "w-4 h-4 mr-2" }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430"] })) })] })] }) })] })] }) }));
}
