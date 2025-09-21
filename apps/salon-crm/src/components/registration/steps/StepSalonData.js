import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { Building2, Globe, Car, Home, Monitor } from 'lucide-react';
const StepSalonData = ({ data, updateData, onNext, onPrevious }) => {
    const { t } = useTranslation();
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const businessTypes = [
        {
            id: 'salon',
            icon: Building2,
            title: t('registration.salon.businessTypes.salon.title', 'Клиенты приходят в салон'),
            description: t('registration.salon.businessTypes.salon.description', 'Стационарный салон с постоянным адресом'),
            emoji: '🏢'
        },
        {
            id: 'mobile',
            icon: Car,
            title: t('registration.salon.businessTypes.mobile.title', 'Мобильный мастер'),
            description: t('registration.salon.businessTypes.mobile.description', 'Выезжаю к клиентам на дом'),
            emoji: '🚗'
        },
        {
            id: 'home',
            icon: Home,
            title: t('registration.salon.businessTypes.home.title', 'Работаю на дому'),
            description: t('registration.salon.businessTypes.home.description', 'Принимаю клиентов у себя дома'),
            emoji: '🏠'
        },
        {
            id: 'online',
            icon: Monitor,
            title: t('registration.salon.businessTypes.online.title', 'Онлайн консультации'),
            description: t('registration.salon.businessTypes.online.description', 'Видеоконсультации и онлайн услуги'),
            emoji: '💻'
        }
    ];
    const validateForm = () => {
        const newErrors = {};
        // Валидация названия салона
        if (!data.salonName.trim()) {
            newErrors.salonName = t('registration.validation.salonNameRequired', 'Название салона обязательно');
        }
        else if (data.salonName.trim().length < 3) {
            newErrors.salonName = t('registration.validation.salonNameTooShort', 'Название должно содержать минимум 3 символа');
        }
        // Валидация сайта (если указан)
        if (data.website && data.website.trim()) {
            const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
            if (!urlRegex.test(data.website)) {
                newErrors.website = t('registration.validation.websiteInvalid', 'Введите корректный URL сайта');
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            // Имитируем сохранение данных
            await new Promise(resolve => setTimeout(resolve, 800));
            onNext();
        }
        catch (error) {
            console.error('Ошибка сохранения:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleInputChange = (field, value) => {
        updateData({ [field]: value });
        // Очищаем ошибку при изменении поля
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    const handleBusinessTypeChange = (businessType) => {
        updateData({ businessType });
    };
    const formatWebsiteUrl = (url) => {
        if (!url)
            return '';
        // Автоматически добавляем https:// если протокол не указан
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }
        return url;
    };
    return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.salon.title', 'Расскажите о вашем бизнесе') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.salon.subtitle', 'Название, которое увидят ваши клиенты') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "salonName", className: "block text-sm font-medium text-gray-700", children: [t('registration.salon.salonName', 'Название салона'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Building2, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { id: "salonName", type: "text", value: data.salonName, onChange: (e) => handleInputChange('salonName', e.target.value), placeholder: t('registration.salon.salonNamePlaceholder', 'Beauty Studio "Красота"'), className: `pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.salonName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`, autoFocus: true })] }), errors.salonName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.salonName }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "website", className: "block text-sm font-medium text-gray-700", children: [t('registration.salon.website', 'Веб-сайт'), _jsxs("span", { className: "text-gray-400 text-sm ml-1", children: ["(", t('registration.optional', 'необязательно'), ")"] })] }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Globe, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { id: "website", type: "url", value: data.website || '', onChange: (e) => handleInputChange('website', e.target.value), placeholder: t('registration.salon.websitePlaceholder', 'www.your-salon.com'), className: `pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.website ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`, onBlur: (e) => {
                                                        if (e.target.value) {
                                                            handleInputChange('website', formatWebsiteUrl(e.target.value));
                                                        }
                                                    } })] }), errors.website && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.website })), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: t('registration.salon.websiteNote', 'Если у вас нет сайта, мы поможем создать красивую страницу') })] }), _jsxs("div", { children: [_jsx(Label, { className: "block text-sm font-medium text-gray-700 mb-3", children: t('registration.salon.businessType', 'Как вы работаете с клиентами?') }), _jsx("div", { className: "space-y-3", children: businessTypes.map((type) => {
                                                const IconComponent = type.icon;
                                                const isSelected = data.businessType === type.id;
                                                return (_jsx("button", { type: "button", onClick: () => handleBusinessTypeChange(type.id), className: `w-full p-3 rounded-md border text-left transition-colors ${isSelected
                                                        ? 'border-gray-900 bg-gray-50'
                                                        : 'border-gray-300 hover:border-gray-400'}`, children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(IconComponent, { className: `w-5 h-5 ${isSelected ? 'text-gray-900' : 'text-gray-600'}` }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: `font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`, children: type.title }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: type.description })] }), isSelected && (_jsx("div", { className: "w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }))] }) }, type.id));
                                            }) })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200", disabled: isLoading, children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.saving', 'Сохраняем...')] })) : (t('registration.continue', 'Продолжить')) })] })] }), _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: t('registration.salon.help', 'Не знаете, что выбрать? Вы всегда сможете изменить настройки позже') }) })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Building2, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0432\u0430\u0448\u0435\u0433\u043E \u0431\u0438\u0437\u043D\u0435\u0441\u0430" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u041F\u043E\u043C\u043E\u0433\u0438\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430\u043C \u043D\u0430\u0439\u0442\u0438 \u0438\u043C\u0435\u043D\u043D\u043E \u0432\u0430\u0448 \u0441\u0430\u043B\u043E\u043D" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Building2, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0421\u0442\u0430\u0446\u0438\u043E\u043D\u0430\u0440\u043D\u044B\u0439 \u0441\u0430\u043B\u043E\u043D \u043A\u0440\u0430\u0441\u043E\u0442\u044B" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Car, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0435 \u0443\u0441\u043B\u0443\u0433\u0438 \u043D\u0430 \u0432\u044B\u0435\u0437\u0434" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Home, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0420\u0430\u0431\u043E\u0442\u0430 \u043D\u0430 \u0434\u043E\u043C\u0443" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Monitor, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041E\u043D\u043B\u0430\u0439\u043D \u043A\u043E\u043D\u0441\u0443\u043B\u044C\u0442\u0430\u0446\u0438\u0438" })] })] })] }) }) }) })] }));
};
export default StepSalonData;
