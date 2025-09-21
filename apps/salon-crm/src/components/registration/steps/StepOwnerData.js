import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { Mail, Phone, Globe } from 'lucide-react';
import { detectUserCountry, COUNTRIES, getAllCountries, formatPhoneWithCountryCode } from '../../../utils/country-detection';
const StepOwnerData = ({ data, updateData, onNext }) => {
    const { t, i18n } = useTranslation();
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [detectedCountry, setDetectedCountry] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const languages = [
        { code: 'en', name: t('language.languages.en', 'English') },
        { code: 'pl', name: t('language.languages.pl', 'Polish') },
        { code: 'ua', name: t('language.languages.ua', 'Ukrainian') },
        { code: 'ru', name: t('language.languages.ru', 'Russian') }
    ];
    // Автоопределение страны при загрузке
    useEffect(() => {
        const detectAndSetCountry = async () => {
            try {
                const country = await detectUserCountry();
                setDetectedCountry(country);
                setSelectedCountry(country);
                // Автоматически устанавливаем язык и валюту по стране
                updateData({
                    language: country.language,
                    country: country.code,
                    currency: country.currency
                });
                // Меняем язык интерфейса
                i18n.changeLanguage(country.language);
                // Если телефон еще не введен, устанавливаем код страны
                if (!data.phone || data.phone.trim() === '') {
                    updateData({ phone: country.phoneCode + ' ' });
                }
            }
            catch (error) {
                console.warn('Ошибка автоопределения страны:', error);
                // Fallback на Польшу
                const fallback = COUNTRIES['PL'];
                setDetectedCountry(fallback);
                setSelectedCountry(fallback);
                updateData({
                    language: fallback.language,
                    country: fallback.code,
                    currency: fallback.currency,
                    phone: data.phone || fallback.phoneCode + ' '
                });
            }
        };
        detectAndSetCountry();
    }, []); // Запускаем только один раз при монтировании
    const validateForm = () => {
        const newErrors = {};
        // Валидация имени
        if (!data.firstName.trim()) {
            newErrors.firstName = t('registration.validation.firstNameRequired', 'Имя обязательно');
        }
        else if (data.firstName.trim().length < 2) {
            newErrors.firstName = t('registration.validation.firstNameTooShort', 'Имя должно содержать минимум 2 символа');
        }
        // Валидация фамилии
        if (!data.lastName.trim()) {
            newErrors.lastName = t('registration.validation.lastNameRequired', 'Фамилия обязательна');
        }
        else if (data.lastName.trim().length < 2) {
            newErrors.lastName = t('registration.validation.lastNameTooShort', 'Фамилия должна содержать минимум 2 символа');
        }
        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email.trim()) {
            newErrors.email = t('registration.validation.emailRequired', 'Email обязателен');
        }
        else if (!emailRegex.test(data.email)) {
            newErrors.email = t('registration.validation.emailInvalid', 'Введите корректный email');
        }
        // Валидация телефона
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!data.phone.trim()) {
            newErrors.phone = t('registration.validation.phoneRequired', 'Телефон обязателен');
        }
        else if (!phoneRegex.test(data.phone)) {
            newErrors.phone = t('registration.validation.phoneInvalid', 'Введите корректный номер телефона');
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
            // Здесь можно добавить проверку уникальности email
            // const response = await fetch('/api/register/check-email', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ email: data.email })
            // });
            // Имитируем проверку
            await new Promise(resolve => setTimeout(resolve, 1000));
            onNext();
        }
        catch (error) {
            console.error('Ошибка валидации:', error);
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
    const handleLanguageChange = (langCode) => {
        updateData({ language: langCode });
        i18n.changeLanguage(langCode);
    };
    return (_jsx("div", { className: "min-h-screen", children: _jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-2xl space-y-8", children: [_jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "w-40", children: _jsxs("div", { className: "relative", children: [_jsx(Globe, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" }), _jsx("select", { value: data.language, onChange: (e) => handleLanguageChange(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer", children: languages.map((lang) => (_jsx("option", { value: lang.code, children: lang.name }, lang.code))) }), _jsx("div", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none", children: _jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }) })] }) }) }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.owner.title', 'Расскажите о себе') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.owner.subtitle', 'Эта информация нужна для создания вашего аккаунта') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsxs(Label, { htmlFor: "firstName", className: "block text-sm font-medium text-gray-700", children: [t('registration.owner.firstName', 'Имя'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "firstName", type: "text", value: data.firstName, onChange: (e) => handleInputChange('firstName', e.target.value), placeholder: t('registration.owner.firstNamePlaceholder', 'Введите ваше имя'), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`, autoFocus: true }), errors.firstName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.firstName }))] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "lastName", className: "block text-sm font-medium text-gray-700", children: [t('registration.owner.lastName', 'Фамилия'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(Input, { id: "lastName", type: "text", value: data.lastName, onChange: (e) => handleInputChange('lastName', e.target.value), placeholder: t('registration.owner.lastNamePlaceholder', 'Введите вашу фамилию'), className: `mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}` }), errors.lastName && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.lastName }))] })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: [t('registration.owner.email', 'Email'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "mt-1 relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { id: "email", type: "email", value: data.email, onChange: (e) => handleInputChange('email', e.target.value), placeholder: t('registration.owner.emailPlaceholder', 'your@email.com'), className: `pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}` })] }), errors.email && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email })), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: t('registration.owner.emailNote', 'Этот email будет использоваться для входа в систему') })] }), _jsxs("div", { children: [_jsxs(Label, { htmlFor: "phone", className: "block text-sm font-medium text-gray-700", children: [t('registration.owner.phone', 'Телефон'), " ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsxs("div", { className: "mt-1 flex gap-2", children: [_jsx("div", { className: "w-32", children: _jsx("select", { value: selectedCountry?.code || 'PL', onChange: (e) => {
                                                                const country = COUNTRIES[e.target.value];
                                                                if (country) {
                                                                    setSelectedCountry(country);
                                                                    // Обновляем код телефона
                                                                    const currentNumber = data.phone.replace(/^\+\d+\s*/, '');
                                                                    updateData({ phone: country.phoneCode + ' ' + currentNumber });
                                                                }
                                                            }, className: "w-full px-2 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent", children: getAllCountries().map((country) => (_jsxs("option", { value: country.code, children: [country.flag, " ", country.phoneCode] }, country.code))) }) }), _jsxs("div", { className: "flex-1 relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { id: "phone", type: "tel", value: data.phone, onChange: (e) => {
                                                                    let value = e.target.value;
                                                                    // Автоматически форматируем номер с кодом страны
                                                                    if (selectedCountry && !value.startsWith('+')) {
                                                                        value = formatPhoneWithCountryCode(value, selectedCountry);
                                                                    }
                                                                    handleInputChange('phone', value);
                                                                }, placeholder: selectedCountry ? `${selectedCountry.phoneCode} 123 456 789` : '+48 123 456 789', className: `pl-10 block w-full border-gray-300 rounded-r-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}` })] })] }), errors.phone && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.phone })), _jsxs("div", { className: "mt-1 flex items-center gap-2 text-sm text-gray-500", children: [_jsx("p", { children: t('registration.owner.phoneNote', 'Понадобится для SMS подтверждения') }), detectedCountry && (_jsxs("span", { className: "text-xs bg-green-100 text-green-800 px-2 py-1 rounded", children: [detectedCountry.flag, " ", t('registration.owner.autoDetected', 'Автоопределено')] }))] })] })] }), _jsx("div", { children: _jsx(Button, { type: "submit", className: "w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200", disabled: isLoading, children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.owner.checking', 'Проверяем данные...')] })) : (t('registration.continue', 'Продолжить')) }) })] }), _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: t('registration.owner.privacy', 'Регистрируясь, вы соглашаетесь с нашими условиями использования и политикой конфиденциальности') }) })] }) }) }));
};
export default StepOwnerData;
