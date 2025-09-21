import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { MapPin, Globe, DollarSign } from 'lucide-react';
const StepLocation = ({ data, updateData, onNext, onPrevious }) => {
    const { t } = useTranslation();
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    // Список стран с валютами (без России)
    const countries = [
        { code: 'PL', name: 'Poland', localName: 'Polska', currency: 'PLN', flag: '🇵🇱' },
        { code: 'DE', name: 'Germany', localName: 'Deutschland', currency: 'EUR', flag: '🇩🇪' },
        { code: 'IT', name: 'Italy', localName: 'Italia', currency: 'EUR', flag: '🇮🇹' },
        { code: 'FR', name: 'France', localName: 'France', currency: 'EUR', flag: '🇫🇷' },
        { code: 'ES', name: 'Spain', localName: 'España', currency: 'EUR', flag: '🇪🇸' },
        { code: 'UA', name: 'Ukraine', localName: 'Україна', currency: 'UAH', flag: '🇺🇦' },
        { code: 'US', name: 'United States', localName: 'USA', currency: 'USD', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', localName: 'UK', currency: 'EUR', flag: '🇬🇧' },
        { code: 'CZ', name: 'Czech Republic', localName: 'Česká republika', currency: 'EUR', flag: '🇨🇿' },
        { code: 'AT', name: 'Austria', localName: 'Österreich', currency: 'EUR', flag: '🇦🇹' },
        { code: 'NL', name: 'Netherlands', localName: 'Nederland', currency: 'EUR', flag: '🇳🇱' },
        { code: 'BE', name: 'Belgium', localName: 'België', currency: 'EUR', flag: '🇧🇪' }
    ];
    const currencies = [
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱' },
        { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
        { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
        { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', flag: '🇺🇦' }
    ];
    // Автоопределение страны по геолокации
    useEffect(() => {
        const detectCountry = async () => {
            try {
                // Пытаемся определить страну через IP
                const response = await fetch('https://ipapi.co/json/');
                const locationData = await response.json();
                if (locationData.country_name && !data.country) {
                    const detectedCountry = countries.find(c => c.name === locationData.country_name ||
                        c.code === locationData.country_code);
                    if (detectedCountry) {
                        updateData({
                            country: detectedCountry.name,
                            currency: detectedCountry.currency
                        });
                    }
                    else {
                        // Fallback к Poland если страна не поддерживается
                        updateData({
                            country: 'Poland',
                            currency: 'PLN'
                        });
                    }
                }
            }
            catch (error) {
                console.log('Не удалось определить страну, используем Poland по умолчанию');
                if (!data.country) {
                    updateData({
                        country: 'Poland',
                        currency: 'PLN'
                    });
                }
            }
        };
        detectCountry();
    }, []);
    // Автоопределение валюты при смене страны
    useEffect(() => {
        if (data.country) {
            const selectedCountry = countries.find(c => c.name === data.country);
            if (selectedCountry && selectedCountry.currency !== data.currency) {
                updateData({ currency: selectedCountry.currency });
            }
        }
    }, [data.country]);
    // Показать форму адреса для стационарных салонов
    useEffect(() => {
        setShowAddressForm(data.businessType === 'salon');
    }, [data.businessType]);
    const validateForm = () => {
        const newErrors = {};
        // Валидация страны
        if (!data.country.trim()) {
            newErrors.country = t('registration.validation.countryRequired', 'Выберите страну');
        }
        // Валидация адреса для стационарных салонов
        if (showAddressForm) {
            if (!data.address?.street?.trim()) {
                newErrors.street = t('registration.validation.streetRequired', 'Введите адрес');
            }
            if (!data.address?.city?.trim()) {
                newErrors.city = t('registration.validation.cityRequired', 'Введите город');
            }
            if (!data.address?.postalCode?.trim()) {
                newErrors.postalCode = t('registration.validation.postalCodeRequired', 'Введите индекс');
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
            // Имитируем геокодирование адреса
            await new Promise(resolve => setTimeout(resolve, 1000));
            onNext();
        }
        catch (error) {
            console.error('Ошибка сохранения:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCountryChange = (countryName) => {
        updateData({ country: countryName });
        // Очищаем ошибку
        if (errors.country) {
            setErrors(prev => ({ ...prev, country: undefined }));
        }
    };
    const handleAddressChange = (field, value) => {
        const currentAddress = data.address || { street: '', city: '', postalCode: '' };
        updateData({
            address: {
                ...currentAddress,
                [field]: value
            }
        });
        // Очищаем ошибку
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    const handleCurrencyChange = (currencyCode) => {
        updateData({ currency: currencyCode });
    };
    const getCountryQuestion = () => {
        switch (data.businessType) {
            case 'mobile':
                return t('registration.location.questionMobile', 'В какой стране вы работаете?');
            case 'home':
                return t('registration.location.questionHome', 'В какой стране ваш дом?');
            case 'online':
                return t('registration.location.questionOnline', 'В какой стране вы находитесь?');
            default:
                return t('registration.location.questionSalon', 'Где находится ваш салон?');
        }
    };
    return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: getCountryQuestion() }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.location.subtitle', 'Это поможет настроить валюту и локальные особенности') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: [_jsx(Globe, { className: "w-4 h-4 inline mr-2" }), t('registration.location.country', 'Страна'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto", children: countries.map((country) => {
                                                const isSelected = data.country === country.name;
                                                return (_jsx("button", { type: "button", onClick: () => handleCountryChange(country.name), className: `p-3 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                                                        ? 'border-green-500 bg-green-50 text-green-700'
                                                        : 'border-gray-200 hover:border-gray-300'}`, children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("span", { className: "text-2xl", children: country.flag }), _jsxs("div", { children: [_jsx("div", { className: `font-medium ${isSelected ? 'text-green-700' : 'text-gray-900'}`, children: country.localName }), _jsx("div", { className: `text-sm ${isSelected ? 'text-green-600' : 'text-gray-500'}`, children: country.name })] })] }) }, country.code));
                                            }) }), errors.country && (_jsx("p", { className: "text-sm text-red-500", children: errors.country }))] }), data.country && (_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { children: [_jsx(DollarSign, { className: "w-4 h-4 inline mr-2" }), t('registration.location.currency', 'Валюта')] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: currencies.map((currency) => {
                                                const isSelected = data.currency === currency.code;
                                                const isRecommended = data.country &&
                                                    countries.find(c => c.name === data.country)?.currency === currency.code;
                                                return (_jsxs("button", { type: "button", onClick: () => handleCurrencyChange(currency.code), className: `p-3 rounded-lg border-2 transition-all duration-200 text-center relative ${isSelected
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-gray-300'}`, children: [isRecommended && (_jsx("div", { className: "absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full", children: t('registration.location.recommended', 'Рекомендуем') })), _jsx("div", { className: "text-2xl mb-1", children: currency.flag }), _jsxs("div", { className: `font-medium ${isSelected ? 'text-blue-700' : 'text-gray-900'}`, children: [currency.symbol, " ", currency.code] }), _jsx("div", { className: `text-sm ${isSelected ? 'text-blue-600' : 'text-gray-600'}`, children: currency.name })] }, currency.code));
                                            }) })] })), showAddressForm && (_jsxs("div", { className: "space-y-4 p-4 bg-gray-50 rounded-lg", children: [_jsx("h3", { className: "font-semibold text-gray-900", children: t('registration.location.addressTitle', 'Адрес салона') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "md:col-span-2 space-y-2", children: [_jsxs(Label, { htmlFor: "street", children: [t('registration.location.street', 'Улица и номер дома'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "street", type: "text", value: data.address?.street || '', onChange: (e) => handleAddressChange('street', e.target.value), placeholder: t('registration.location.streetPlaceholder', 'ул. Красивая, 15'), className: errors.street ? 'border-red-500' : '' }), errors.street && (_jsx("p", { className: "text-sm text-red-500", children: errors.street }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "city", children: [t('registration.location.city', 'Город'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "city", type: "text", value: data.address?.city || '', onChange: (e) => handleAddressChange('city', e.target.value), placeholder: t('registration.location.cityPlaceholder', 'Варшава'), className: errors.city ? 'border-red-500' : '' }), errors.city && (_jsx("p", { className: "text-sm text-red-500", children: errors.city }))] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "postalCode", children: [t('registration.location.postalCode', 'Почтовый индекс'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "postalCode", type: "text", value: data.address?.postalCode || '', onChange: (e) => handleAddressChange('postalCode', e.target.value), placeholder: t('registration.location.postalCodePlaceholder', '00-001'), className: errors.postalCode ? 'border-red-500' : '' }), errors.postalCode && (_jsx("p", { className: "text-sm text-red-500", children: errors.postalCode }))] })] }), _jsx("p", { className: "text-sm text-gray-600", children: t('registration.location.addressNote', 'Точный адрес поможет клиентам легко найти ваш салон') })] })), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200", disabled: isLoading, children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.processing', 'Обрабатываем...')] })) : (t('registration.continue', 'Продолжить')) })] })] })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(MapPin, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0432\u0430\u0448\u0435 \u043C\u0435\u0441\u0442\u043E\u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u042D\u0442\u043E \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u043D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0432\u0430\u043B\u044E\u0442\u0443 \u0438 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0444\u0443\u043D\u043A\u0446\u0438\u0438" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Globe, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0432\u0430\u043B\u044E\u0442\u0430" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(DollarSign, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0435 \u0444\u043E\u0440\u043C\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0446\u0435\u043D" })] })] })] }) }) }) })] }));
};
export default StepLocation;
