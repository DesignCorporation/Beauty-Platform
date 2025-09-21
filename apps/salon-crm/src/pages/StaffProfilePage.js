import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Input, Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Switch, Tabs, TabsList, TabsTrigger, TabsContent, } from '@beauty-platform/ui';
import { ArrowLeft, Edit3, Save, X, Mail, Phone, Shield, DollarSign, Award, Calendar, Sparkles } from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../currency';
const STAFF_COLORS = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Coral', value: '#fb7185' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Teal', value: '#06b6d4' },
    { label: 'Slate', value: '#64748b' },
];
const LANGUAGE_OPTIONS = [
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ua', name: 'Українська', flag: '🇺🇦' },
];
const DEFAULT_SCHEDULE = [
    { day: 'Понедельник', start: '09:00', end: '18:00', isWorking: true },
    { day: 'Вторник', start: '09:00', end: '18:00', isWorking: true },
    { day: 'Среда', start: '09:00', end: '18:00', isWorking: true },
    { day: 'Четверг', start: '09:00', end: '18:00', isWorking: true },
    { day: 'Пятница', start: '09:00', end: '17:00', isWorking: true },
    { day: 'Суббота', start: '10:00', end: '15:00', isWorking: true },
    { day: 'Воскресенье', start: '-', end: '-', isWorking: false },
];
export default function StaffProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { staff } = useStaff();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { formatPrice, supportedCurrencies, currency, changeCurrency } = useCurrency();
    const staffMember = useMemo(() => staff.find((item) => item.id === id) ?? null, [staff, id]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        color: '#6366f1',
        spokenLanguages: ['pl'],
        canSeeFinances: false,
        bio: '',
        specialties: 'Стрижки, окрашивание, уход',
        notes: '',
    });
    useEffect(() => {
        if (!staffMember)
            return;
        setFormData({
            firstName: staffMember.firstName,
            lastName: staffMember.lastName,
            email: staffMember.email,
            phone: staffMember.phone || '',
            color: staffMember.color || '#6366f1',
            spokenLanguages: staffMember.permissions?.filter((perm) => perm.startsWith('lang:')).map((perm) => perm.replace('lang:', '')) || ['pl'],
            canSeeFinances: staffMember.canSeeFinances ?? false,
            bio: '',
            specialties: 'Стрижки, окрашивание, уход',
            notes: '',
        });
    }, [staffMember]);
    if (!staffMember) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 p-6", children: _jsx("div", { className: "mx-auto flex max-w-4xl items-center justify-center rounded-2xl bg-white p-12 shadow-sm", children: _jsxs("div", { className: "space-y-3 text-center", children: [_jsx("div", { className: "text-lg font-medium text-slate-900", children: t('team.profile.notFoundTitle', 'Мастер не найден') }), _jsx("p", { className: "text-slate-500", children: t('team.profile.notFoundSubtitle', 'Выберите мастера на странице команды') }), _jsxs(Button, { onClick: () => navigate('/team'), children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), t('team.profile.backToTeam', 'Вернуться к списку')] })] }) }) }));
    }
    const fullName = `${staffMember.firstName} ${staffMember.lastName}`.trim();
    const initials = `${staffMember.firstName?.charAt(0) ?? ''}${staffMember.lastName?.charAt(0) ?? ''}`.toUpperCase() || '??';
    const accentColor = formData.color;
    const createdAt = staffMember.createdAt ? new Date(staffMember.createdAt) : null;
    const tenure = createdAt ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : null;
    const handleLanguageToggle = (code) => {
        setFormData((prev) => ({
            ...prev,
            spokenLanguages: prev.spokenLanguages.includes(code)
                ? prev.spokenLanguages.filter((lang) => lang !== code)
                : [...prev.spokenLanguages, code],
        }));
    };
    const handleSave = () => {
        showToast({
            title: t('team.profile.savedTitle', 'Профиль обновлен'),
            description: t('team.profile.savedDescription', 'Изменения сохранятся после подключения API'),
            variant: 'success',
        });
        setIsEditing(false);
    };
    const handleCancel = () => {
        if (staffMember) {
            setIsEditing(false);
            setFormData({
                firstName: staffMember.firstName,
                lastName: staffMember.lastName,
                email: staffMember.email,
                phone: staffMember.phone || '',
                color: staffMember.color || '#6366f1',
                spokenLanguages: staffMember.permissions?.filter((perm) => perm.startsWith('lang:')).map((perm) => perm.replace('lang:', '')) || ['pl'],
                canSeeFinances: staffMember.canSeeFinances ?? false,
                bio: '',
                specialties: 'Стрижки, окрашивание, уход',
                notes: '',
            });
        }
    };
    const metrics = {
        avgTicket: formatPrice(65 + (staffMember.priority ?? 1) * 12, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
        monthlyRevenue: formatPrice(5200 + (staffMember.priority ?? 1) * 320, { maximumFractionDigits: 0 }),
        satisfaction: `${88 + Math.min(10, (staffMember.priority ?? 1) * 2)}%`,
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-50 pb-16", children: _jsxs("div", { className: "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", onClick: () => navigate(-1), className: "text-slate-600", children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), t('team.profile.back', 'Назад к команде')] }), _jsxs("div", { className: "flex items-center gap-2", children: [!isEditing && (_jsxs(Button, { variant: "outline", onClick: () => setIsEditing(true), children: [_jsx(Edit3, { className: "mr-2 h-4 w-4" }), t('team.profile.edit', 'Редактировать')] })), isEditing && (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "ghost", onClick: handleCancel, children: [_jsx(X, { className: "mr-2 h-4 w-4" }), t('team.profile.cancel', 'Отмена')] }), _jsxs(Button, { onClick: handleSave, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), t('team.profile.save', 'Сохранить')] })] }))] })] }), _jsx(Card, { className: "border-slate-200", children: _jsxs(CardContent, { className: "flex flex-col gap-6 p-6 lg:flex-row lg:items-center", children: [_jsxs("div", { className: "relative mx-auto flex h-32 w-32 items-center justify-center rounded-full text-3xl font-semibold text-white shadow", style: { backgroundColor: accentColor }, children: [initials, staffMember.isActive && _jsx("span", { className: "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" })] }), _jsxs("div", { className: "flex-1 space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx(CardTitle, { className: "text-2xl text-slate-900", children: fullName }), _jsx(Badge, { variant: "outline", className: "border-slate-200 text-slate-600", children: t(`team.roles.${staffMember.role}`, staffMember.role) }), _jsx(Badge, { variant: staffMember.status === 'ACTIVE' ? 'default' : 'secondary', children: staffMember.status === 'ACTIVE' ? t('common.active', 'Активен') : t('common.inactive', 'Неактивен') })] }), _jsx(CardDescription, { className: "mt-1 text-slate-500", children: t('team.profile.subtitle', 'Профиль мастера и персональные настройки сервиса') })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: t('team.profile.avgTicket', 'Средний чек') }), _jsx("div", { className: "text-lg font-semibold text-slate-900", children: metrics.avgTicket })] }), _jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: t('team.profile.monthlyRevenue', 'Месячный оборот') }), _jsx("div", { className: "text-lg font-semibold text-slate-900", children: metrics.monthlyRevenue })] }), _jsxs("div", { className: "rounded-xl border border-slate-100 bg-slate-50 px-4 py-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-slate-500", children: t('team.profile.satisfaction', 'Лояльность клиентов') }), _jsx("div", { className: "text-lg font-semibold text-emerald-600", children: metrics.satisfaction })] })] }), _jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-slate-600", children: [_jsx(Mail, { className: "h-4 w-4 text-slate-400" }), _jsx("span", { children: staffMember.email })] }), staffMember.phone && (_jsxs("div", { className: "flex items-center gap-2 text-slate-600", children: [_jsx(Phone, { className: "h-4 w-4 text-slate-400" }), _jsx("span", { children: staffMember.phone })] })), createdAt && (_jsxs("div", { className: "flex items-center gap-2 text-slate-600", children: [_jsx(Calendar, { className: "h-4 w-4 text-slate-400" }), _jsxs("span", { children: [t('team.profile.joined', 'В команде с'), " ", createdAt.toLocaleDateString()] })] })), tenure !== null && (_jsxs("div", { className: "flex items-center gap-2 text-slate-600", children: [_jsx(Award, { className: "h-4 w-4 text-slate-400" }), _jsx("span", { children: tenure >= 12
                                                            ? t('team.profile.tenureYears', { defaultValue: '{{count}} лет', count: Math.floor(tenure / 12) })
                                                            : t('team.profile.tenureMonths', { defaultValue: '{{count}} мес', count: tenure }) })] }))] })] })] }) }), _jsxs(Tabs, { value: activeTab, onValueChange: (value) => setActiveTab(value), className: "mt-4", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3 bg-white", children: [_jsx(TabsTrigger, { value: "overview", children: t('team.profile.overviewTab', 'Обзор') }), _jsx(TabsTrigger, { value: "schedule", children: t('team.profile.scheduleTab', 'Расписание') }), _jsx(TabsTrigger, { value: "settings", children: t('team.profile.settingsTab', 'Настройки') })] }), _jsxs(TabsContent, { value: "overview", className: "mt-6 space-y-6", children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "border-slate-200 lg:col-span-2", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.specialties', 'Экспертиза и услуги') }), _jsx(CardDescription, { children: t('team.profile.specialtiesHint', 'Задайте ключевые направления работы мастера и связанные услуги') })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex flex-wrap gap-2 text-sm text-slate-600", children: formData.specialties.split(',').map((item) => (_jsxs(Badge, { variant: "outline", className: "border-slate-200 text-slate-600", children: [_jsx(Sparkles, { className: "mr-1 h-3 w-3" }), item.trim()] }, item))) }), _jsx(Textarea, { value: formData.bio, onChange: (event) => setFormData((prev) => ({ ...prev, bio: event.target.value })), placeholder: t('team.profile.bioPlaceholder', 'Расскажите кратко о стиле работы мастера, сертификатах и любимых услугах'), className: "min-h-[120px]", disabled: !isEditing })] })] }), _jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.languagesTitle', 'Языки общения') }), _jsx(CardDescription, { children: t('team.profile.languagesSubtitle', 'Выберите языки, на которых мастер принимает клиентов') })] }), _jsx(CardContent, { className: "space-y-3", children: LANGUAGE_OPTIONS.map((language) => (_jsxs("label", { className: "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx("span", { className: "text-lg", children: language.flag }), language.name] }), _jsx(Switch, { checked: formData.spokenLanguages.includes(language.code), onCheckedChange: () => handleLanguageToggle(language.code), disabled: !isEditing })] }, language.code))) })] })] }), _jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.accessTitle', 'Права и доступ') }), _jsx(CardDescription, { children: t('team.profile.accessSubtitle', 'Контролируйте доступ к финансовым данным и административным функциям') })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx(Shield, { className: "h-4 w-4 text-slate-400" }), t('team.profile.permissions.finances', 'Доступ к финансовым показателям')] }), _jsx(Switch, { checked: formData.canSeeFinances, onCheckedChange: (value) => setFormData((prev) => ({ ...prev, canSeeFinances: value })), disabled: !isEditing })] }), _jsxs("label", { className: "flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2", children: [_jsxs("span", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx(DollarSign, { className: "h-4 w-4 text-slate-400" }), t('team.profile.permissions.pricing', 'Право изменять цены услуг')] }), _jsx(Badge, { variant: "outline", className: "border-slate-200 text-slate-600", children: t('team.profile.permissions.availableSoon', 'Скоро') })] })] })] })] }), _jsxs(TabsContent, { value: "schedule", className: "mt-6 space-y-6", children: [_jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.scheduleTitle', 'Рабочие часы') }), _jsx(CardDescription, { children: t('team.profile.scheduleSubtitle', 'Гибко управляйте расписанием и доступностью мастера в календаре CRM') })] }), _jsx(CardContent, { className: "overflow-hidden rounded-xl border border-slate-100 bg-white", children: _jsx("div", { className: "grid gap-2", children: DEFAULT_SCHEDULE.map((item) => (_jsxs("div", { className: "grid grid-cols-2 items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600", children: [_jsx("span", { className: "font-medium text-slate-700", children: item.day }), item.isWorking ? (_jsxs("span", { className: "justify-self-end text-slate-800", children: [item.start, " \u2014 ", item.end] })) : (_jsx("span", { className: "justify-self-end text-slate-400", children: t('team.profile.dayOff', 'Выходной') }))] }, item.day))) }) })] }), _jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.notesTitle', 'Заметки для команды') }), _jsx(CardDescription, { children: t('team.profile.notesSubtitle', 'Поделитесь рекомендациями по работе с мастером') })] }), _jsx(CardContent, { children: _jsx(Textarea, { value: formData.notes, onChange: (event) => setFormData((prev) => ({ ...prev, notes: event.target.value })), placeholder: t('team.profile.notesPlaceholder', 'Например: предпочитает встречи до 16:00, ведет VIP-клиентов, обучает новых мастеров'), className: "min-h-[120px]", disabled: !isEditing }) })] })] }), _jsxs(TabsContent, { value: "settings", className: "mt-6 space-y-6", children: [_jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.appearanceTitle', 'Стиль и цвета') }), _jsx(CardDescription, { children: t('team.profile.appearanceSubtitle', 'Настройте цветовую схему карточек мастера в CRM') })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx(Label, { children: t('team.profile.colorLabel', 'Акцентный цвет') }), _jsx("div", { className: "flex flex-wrap gap-2", children: STAFF_COLORS.map((color) => (_jsx("button", { type: "button", className: `h-10 w-10 rounded-full border-2 ${formData.color === color.value ? 'border-slate-900' : 'border-transparent'}`, style: { backgroundColor: color.value }, onClick: () => isEditing && setFormData((prev) => ({ ...prev, color: color.value })), "aria-label": color.label }, color.value))) }), _jsx(Input, { value: formData.color, onChange: (event) => setFormData((prev) => ({ ...prev, color: event.target.value })), disabled: !isEditing })] })] }), _jsxs(Card, { className: "border-slate-200", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: t('team.profile.currencyTitle', 'Валюта показателей') }), _jsx(CardDescription, { children: t('team.profile.currencySubtitle', 'Отображение KPI мастера в удобной валюте') })] }), _jsxs(CardContent, { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs(Select, { value: currency, onValueChange: (value) => changeCurrency(value), children: [_jsx(SelectTrigger, { className: "w-full bg-white sm:w-64", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: supportedCurrencies.map((item) => (_jsxs(SelectItem, { value: item.code, children: [item.flag, " ", item.code, " \u2014 ", item.name] }, item.code))) })] }), _jsx("p", { className: "text-sm text-slate-500", children: t('team.profile.currencyHint', 'Эта настройка влияет на блоки аналитики и дашборды') })] })] })] })] })] }) }));
}
