import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { ArrowLeft, UserPlus, Mail, Phone, User, MessageSquare, Shield, CheckCircle, Send } from 'lucide-react';
const roles = [
    { value: 'STAFF_MEMBER', label: 'Мастер', description: 'Основная роль для оказания услуг', color: 'text-green-600' },
    { value: 'MANAGER', label: 'Менеджер', description: 'Управление операциями салона', color: 'text-blue-600' },
    { value: 'RECEPTIONIST', label: 'Администратор', description: 'Работа с клиентами и записями', color: 'text-orange-600' },
    { value: 'ACCOUNTANT', label: 'Бухгалтер', description: 'Финансовый учет', color: 'text-gray-600' }
];
const defaultPermissions = {
    STAFF_MEMBER: ['calendar.view', 'appointments.manage'],
    MANAGER: ['calendar.view', 'calendar.edit', 'appointments.view', 'appointments.manage', 'clients.view', 'services.view'],
    RECEPTIONIST: ['calendar.view', 'appointments.view', 'appointments.manage', 'clients.view', 'clients.manage'],
    ACCOUNTANT: ['appointments.view', 'clients.view', 'finances.view']
};
const permissionLabels = {
    'calendar.view': 'Просмотр календаря',
    'calendar.edit': 'Редактирование календаря',
    'appointments.view': 'Просмотр записей',
    'appointments.manage': 'Управление записями',
    'clients.view': 'Просмотр клиентов',
    'clients.manage': 'Управление клиентами',
    'services.view': 'Просмотр услуг',
    'finances.view': 'Просмотр финансов'
};
export default function InviteStaffPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        masterName: '',
        masterEmail: '',
        masterPhone: '',
        role: 'STAFF_MEMBER',
        personalMessage: 'Приглашаю работать в нашем салоне! У нас дружный коллектив и постоянный поток клиентов.'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleRoleChange = (value) => {
        setFormData(prev => ({ ...prev, role: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const invitationData = {
                ...formData,
                permissions: defaultPermissions[formData.role],
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 дней
            };
            console.log('Отправка приглашения:', invitationData);
            // Симулируем успешную отправку на время разработки
            await new Promise(resolve => setTimeout(resolve, 2000));
            // const response = await fetch('/api/invitations', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json'
            //   },
            //   credentials: 'include',
            //   body: JSON.stringify(invitationData)
            // });
            // const data = await response.json();
            // if (!response.ok) {
            //   throw new Error(data.message || `HTTP ${response.status}`);
            // }
            // Симулируем успех
            setSuccess(true);
        }
        catch (err) {
            console.error('Error creating invitation:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка при отправке приглашения');
        }
        finally {
            setLoading(false);
        }
    };
    const selectedRole = roles.find(r => r.value === formData.role);
    if (success) {
        return (_jsx("div", { className: "p-6", children: _jsx("div", { className: "max-w-2xl mx-auto", children: _jsxs(Card, { className: "border-2 border-green-200 bg-green-50", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "w-8 h-8 text-green-600" }) }), _jsx(CardTitle, { className: "text-xl text-green-900", children: "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E! \uD83C\uDF89" })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsxs("p", { className: "text-green-800", children: ["\u041C\u0430\u0441\u0442\u0435\u0440 ", _jsx("strong", { children: formData.masterName }), " \u043F\u043E\u043B\u0443\u0447\u0438\u0442 email-\u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043D\u0430 \u0430\u0434\u0440\u0435\u0441:"] }), _jsx("div", { className: "bg-white border border-green-200 rounded-lg p-3", children: _jsx("div", { className: "font-mono text-sm text-green-900", children: formData.masterEmail }) }), _jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6", children: [_jsx("h4", { className: "font-semibold text-blue-900 mb-2", children: "\u0427\u0442\u043E \u0434\u0430\u043B\u044C\u0448\u0435?" }), _jsxs("div", { className: "text-sm text-blue-800 space-y-1", children: [_jsx("div", { children: "\u2022 \u041C\u0430\u0441\u0442\u0435\u0440 \u043F\u043E\u043B\u0443\u0447\u0438\u0442 email \u0441 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435\u043C \u0438 \u0441\u0441\u044B\u043B\u043A\u043E\u0439" }), _jsx("div", { children: "\u2022 \u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F: 7 \u0434\u043D\u0435\u0439" }), _jsx("div", { children: "\u2022 \u041F\u043E\u0441\u043B\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u044F \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u043C\u0430\u0441\u0442\u0435\u0440 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0432 \u0440\u0430\u0437\u0434\u0435\u043B\u0435 \"\u041A\u043E\u043C\u0430\u043D\u0434\u0430\"" }), _jsx("div", { children: "\u2022 \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0439 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445" })] })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => navigate('/team'), className: "flex-1", children: "\u041A \u0441\u043F\u0438\u0441\u043A\u0443 \u043A\u043E\u043C\u0430\u043D\u0434\u044B" }), _jsx(Button, { onClick: () => {
                                                setSuccess(false);
                                                setFormData({
                                                    masterName: '',
                                                    masterEmail: '',
                                                    masterPhone: '',
                                                    role: 'STAFF_MEMBER',
                                                    personalMessage: 'Приглашаю работать в нашем салоне! У нас дружный коллектив и постоянный поток клиентов.'
                                                });
                                            }, className: "flex-1", children: "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u0435\u0449\u0435" })] })] })] }) }) }));
    }
    return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center mb-8", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => navigate('/team'), className: "mr-4", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "\u041D\u0430\u0437\u0430\u0434"] }), _jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 flex items-center gap-3", children: [_jsx(UserPlus, { className: "w-8 h-8 text-purple-600" }), "\u041F\u0440\u0438\u0433\u043B\u0430\u0441\u0438\u0442\u044C \u043C\u0430\u0441\u0442\u0435\u0440\u0430"] }), _jsx("p", { className: "text-gray-600 mt-1", children: "\u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0440\u0430\u0431\u043E\u0442\u044B \u0432 \u0441\u0430\u043B\u043E\u043D\u0435" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u0414\u0430\u043D\u043D\u044B\u0435 \u043C\u0430\u0441\u0442\u0435\u0440\u0430" }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm", children: error })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "masterName", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(User, { className: "w-4 h-4" }), "\u0418\u043C\u044F \u043C\u0430\u0441\u0442\u0435\u0440\u0430 *"] }), _jsx(Input, { id: "masterName", name: "masterName", type: "text", value: formData.masterName, onChange: handleInputChange, placeholder: "\u0410\u043D\u043D\u0430 \u041C\u0430\u0441\u0442\u0435\u0440\u043E\u0432\u0430", required: true, disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "masterEmail", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Mail, { className: "w-4 h-4" }), "Email *"] }), _jsx(Input, { id: "masterEmail", name: "masterEmail", type: "email", value: formData.masterEmail, onChange: handleInputChange, placeholder: "anna@example.com", required: true, disabled: loading, className: "mt-1" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "masterPhone", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Phone, { className: "w-4 h-4" }), "\u0422\u0435\u043B\u0435\u0444\u043E\u043D"] }), _jsx(Input, { id: "masterPhone", name: "masterPhone", type: "tel", value: formData.masterPhone, onChange: handleInputChange, placeholder: "+48 123 456 789", disabled: loading, className: "mt-1" })] }), _jsxs("div", { children: [_jsxs(Label, { className: "text-sm font-medium flex items-center gap-1", children: [_jsx(Shield, { className: "w-4 h-4" }), "\u0420\u043E\u043B\u044C \u0432 \u0441\u0430\u043B\u043E\u043D\u0435 *"] }), _jsxs(Select, { value: formData.role, onValueChange: handleRoleChange, disabled: loading, children: [_jsx(SelectTrigger, { className: "mt-1", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: roles.map((role) => (_jsx(SelectItem, { value: role.value, children: _jsxs("div", { children: [_jsx("div", { className: `font-medium ${role.color}`, children: role.label }), _jsx("div", { className: "text-xs text-gray-500", children: role.description })] }) }, role.value))) })] })] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "personalMessage", className: "text-sm font-medium flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "\u041B\u0438\u0447\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435"] }), _jsx("textarea", { id: "personalMessage", name: "personalMessage", value: formData.personalMessage, onChange: handleInputChange, placeholder: "\u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043B\u0438\u0447\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F...", disabled: loading, className: "mt-1 min-h-[120px] flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\u042D\u0442\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0431\u0443\u0434\u0435\u0442 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u0432 email \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435" })] }), _jsx(Button, { type: "submit", disabled: loading || !formData.masterName || !formData.masterEmail, className: "w-full bg-purple-600 hover:bg-purple-700", size: "lg", children: loading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" }), "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u043C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435"] })) })] }) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-lg", children: "\u041F\u0440\u0430\u0432\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430" }), selectedRole && (_jsxs("p", { className: `text-sm ${selectedRole.color}`, children: ["\u0420\u043E\u043B\u044C: ", selectedRole.label] }))] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: defaultPermissions[formData.role].map((permission) => (_jsxs("div", { className: "flex items-center text-sm bg-blue-50 text-blue-800 px-3 py-2 rounded-lg", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2 text-blue-600" }), permissionLabels[permission] || permission] }, permission))) }) })] }), _jsxs(Card, { className: "bg-purple-50 border-purple-200", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg text-purple-900", children: "\uD83D\uDE80 \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0439" }) }), _jsxs(CardContent, { className: "text-sm text-purple-800 space-y-3", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" }), _jsx("div", { children: "\u041C\u0430\u0441\u0442\u0435\u0440 \u043F\u043E\u043B\u0443\u0447\u0438\u0442 email \u0441 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435\u043C \u0438 \u0441\u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u0438\u0442\u044C\u0441\u044F \u043A \u0432\u0430\u0448\u0435\u043C\u0443 \u0441\u0430\u043B\u043E\u043D\u0443" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" }), _jsx("div", { children: "\u0415\u0441\u043B\u0438 \u0443 \u043D\u0435\u0433\u043E \u0443\u0436\u0435 \u0435\u0441\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442, \u043E\u043D \u0441\u043C\u043E\u0436\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u0438\u0445 \u0441\u0430\u043B\u043E\u043D\u0430\u0445" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" }), _jsx("div", { children: "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 7 \u0434\u043D\u0435\u0439" })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" }), _jsx("div", { children: "\u041C\u0430\u0441\u0442\u0435\u0440 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E (\u043E\u043F\u043B\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0441\u0430\u043B\u043E\u043D)" })] })] })] })] })] })] }) }));
}
