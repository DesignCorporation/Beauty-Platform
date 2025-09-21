import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, Input, Label } from '@beauty-platform/ui';
import { X, User, Mail, Phone, Palette } from 'lucide-react';
const predefinedColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#a29bfe', '#fd79a8', '#e17055',
    '#00b894', '#0984e3', '#6c5ce7', '#e84393'
];
export const AddStaffModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        color: '#6366f1'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleColorSelect = (color) => {
        setFormData(prev => ({ ...prev, color }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/crm/staff', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer mock-jwt-token-for-testing',
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            if (data.success) {
                // Успешно создано
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    color: '#6366f1'
                });
                onSuccess();
                onClose();
            }
            else {
                throw new Error(data.error || 'Не удалось создать мастера');
            }
        }
        catch (err) {
            console.error('Error creating staff:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка при создании мастера');
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        if (!loading) {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                color: '#6366f1'
            });
            setError(null);
            onClose();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full mx-4", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [_jsx(User, { className: "w-5 h-5" }), "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u043E\u0432\u043E\u0433\u043E \u043C\u0430\u0441\u0442\u0435\u0440\u0430"] }), _jsx("button", { onClick: handleClose, disabled: loading, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm", children: error })), _jsxs("div", { children: [_jsx(Label, { htmlFor: "firstName", className: "text-sm font-medium", children: "\u0418\u043C\u044F *" }), _jsx(Input, { id: "firstName", name: "firstName", type: "text", value: formData.firstName, onChange: handleInputChange, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043C\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0430", required: true, disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "lastName", className: "text-sm font-medium", children: "\u0424\u0430\u043C\u0438\u043B\u0438\u044F *" }), _jsx(Input, { id: "lastName", name: "lastName", type: "text", value: formData.lastName, onChange: handleInputChange, placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0444\u0430\u043C\u0438\u043B\u0438\u044E \u043C\u0430\u0441\u0442\u0435\u0440\u0430", required: true, disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "email", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Mail, { className: "w-4 h-4" }), "Email *"] }), _jsx(Input, { id: "email", name: "email", type: "email", value: formData.email, onChange: handleInputChange, placeholder: "email@example.com", required: true, disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "phone", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Phone, { className: "w-4 h-4" }), "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"] }), _jsx(Input, { id: "phone", name: "phone", type: "tel", value: formData.phone, onChange: handleInputChange, placeholder: "+7 (999) 123-45-67", disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsxs(Label, { className: "text-sm font-medium flex items-center gap-1 mb-2", children: [_jsx(Palette, { className: "w-4 h-4" }), "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0439 \u0446\u0432\u0435\u0442"] }), _jsx("div", { className: "grid grid-cols-6 gap-2", children: predefinedColors.map((color) => (_jsx("button", { type: "button", onClick: () => handleColorSelect(color), className: `w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`, style: { backgroundColor: color }, disabled: loading }, color))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\u042D\u0442\u043E\u0442 \u0446\u0432\u0435\u0442 \u0431\u0443\u0434\u0435\u0442 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u0442\u044C\u0441\u044F \u0432 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0435 \u0434\u043B\u044F \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043C\u0430\u0441\u0442\u0435\u0440\u0430" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, disabled: loading, className: "flex-1", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }), _jsx(Button, { type: "submit", disabled: loading || !formData.firstName || !formData.lastName || !formData.email, className: "flex-1", children: loading ? 'Создание...' : 'Создать мастера' })] })] })] }) }) }));
};
