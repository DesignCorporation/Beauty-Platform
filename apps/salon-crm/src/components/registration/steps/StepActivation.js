import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { CheckCircle, Mail, Smartphone, Shield, AlertCircle, Sparkles } from 'lucide-react';
const StepActivation = ({ data, updateData, onPrevious }) => {
    const { t } = useTranslation();
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [smsSent, setSmsSent] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [step, setStep] = useState('email');
    // Таймер для повторной отправки SMS
    useEffect(() => {
        let timer;
        if (smsCountdown > 0) {
            timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [smsCountdown]);
    // Автоматическая отправка email при загрузке
    useEffect(() => {
        if (!emailSent) {
            sendEmailVerification();
        }
    }, []);
    const sendEmailVerification = async () => {
        try {
            // Имитируем отправку email
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEmailSent(true);
            // Пропускаем SMS и сразу переходим к условиям
            setTimeout(() => setStep('terms'), 2000);
        }
        catch (error) {
            console.error('Ошибка отправки email:', error);
        }
    };
    const sendSMSVerification = async () => {
        try {
            setIsLoading(true);
            // Имитируем отправку SMS
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSmsSent(true);
            setSmsCountdown(60);
        }
        catch (error) {
            console.error('Ошибка отправки SMS:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const validateSMSCode = () => {
        const newErrors = {};
        if (!data.smsCode || data.smsCode.length !== 6) {
            newErrors.smsCode = t('registration.validation.smsCodeRequired', 'Введите 6-значный код из SMS');
        }
        else if (!/^\d{6}$/.test(data.smsCode)) {
            newErrors.smsCode = t('registration.validation.smsCodeInvalid', 'Код должен содержать только цифры');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const validateTerms = () => {
        const newErrors = {};
        if (!data.acceptTerms) {
            newErrors.terms = t('registration.validation.termsRequired', 'Необходимо принять условия использования');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSMSVerification = async (e) => {
        e.preventDefault();
        if (!validateSMSCode()) {
            return;
        }
        // Имитируем проверку SMS кода
        if (data.smsCode === '123456' || data.smsCode === '000000') {
            setStep('terms');
        }
        else {
            setErrors({ smsCode: t('registration.validation.smsCodeWrong', 'Неверный код. Попробуйте еще раз.') });
        }
    };
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!validateTerms()) {
            return;
        }
        setIsLoading(true);
        setStep('creating');
        try {
            // Реальный API вызов для создания салона
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://auth.beauty.designcorp.eu'}/salon-registration/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to create salon');
            }
            if (result.success) {
                // Сохраняем данные для входа
                localStorage.setItem('salonLoginData', JSON.stringify(result.data.loginCredentials));
                // Перенаправление на страницу входа с предзаполненными данными
                const loginUrl = result.data.loginCredentials.loginUrl;
                window.location.href = loginUrl;
            }
            else {
                throw new Error(result.error || 'Unknown error occurred');
            }
        }
        catch (error) {
            console.error('Ошибка создания аккаунта:', error);
            setIsLoading(false);
            // Можно показать ошибку пользователю
            alert(`Ошибка создания салона: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setStep('terms'); // Вернуться к предыдущему шагу
        }
    };
    const handleInputChange = (field, value) => {
        updateData({ [field]: value });
        // Очищаем ошибки
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    const formatPhone = (phone) => {
        // Форматируем телефон для отображения
        return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    };
    // Шаг 1: Отправка email
    if (step === 'email') {
        return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.activation.emailTitle', 'Проверяем ваш email') }), _jsxs("p", { className: "mt-2 text-sm text-gray-600", children: [t('registration.activation.emailSubtitle', 'Мы отправили письмо на'), " ", _jsx("strong", { children: data.email })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-4", children: [emailSent ? (_jsx(CheckCircle, { className: "w-6 h-6 text-gray-900" })) : (_jsx("div", { className: "w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" })), _jsx("span", { className: "font-medium text-gray-900", children: emailSent
                                                    ? t('registration.activation.emailSent', 'Email отправлен!')
                                                    : t('registration.activation.emailSending', 'Отправляем email...') })] }), emailSent && (_jsx("p", { className: "text-gray-700 text-sm text-center", children: t('registration.activation.emailInstructions', 'Проверьте папку "Спам", если письмо не пришло') }))] }), _jsx("div", { className: "flex justify-center", children: _jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", children: t('registration.back', 'Назад') }) })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Mail, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 email" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u041C\u044B \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0438 \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043D\u0430 \u0432\u0430\u0448 email \u0430\u0434\u0440\u0435\u0441" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0417\u0430\u0449\u0438\u0449\u0435\u043D\u043D\u0430\u044F \u0432\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0435\u0440\u0435\u0445\u043E\u0434" })] })] })] }) }) }) })] }));
    }
    // Шаг 2: SMS верификация
    if (step === 'sms') {
        return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.activation.smsTitle', 'Подтвердите номер телефона') }), _jsxs("p", { className: "mt-2 text-sm text-gray-600", children: [t('registration.activation.smsSubtitle', 'Мы отправили код на'), " ", _jsx("strong", { children: formatPhone(data.phone) })] })] }), !smsSent ? (_jsx("div", { className: "text-center", children: _jsx(Button, { onClick: sendSMSVerification, disabled: isLoading, className: "bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-3 rounded-md font-medium transition-colors", children: isLoading ? (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.activation.smsSending', 'Отправляем SMS...')] })) : (t('registration.activation.sendSMS', 'Отправить SMS код')) }) })) : (_jsxs("form", { onSubmit: handleSMSVerification, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "smsCode", className: "text-center block text-sm font-medium text-gray-700", children: t('registration.activation.enterCode', 'Введите код из SMS') }), _jsx(Input, { id: "smsCode", type: "text", value: data.smsCode || '', onChange: (e) => handleInputChange('smsCode', e.target.value.replace(/\D/g, '').slice(0, 6)), placeholder: "123456", className: `text-center text-2xl font-mono tracking-widest border-gray-300 focus:ring-gray-900 focus:border-gray-900 ${errors.smsCode ? 'border-red-500' : ''}`, maxLength: 6, autoFocus: true, autoComplete: "one-time-code" }), errors.smsCode && (_jsx("p", { className: "text-sm text-red-500 text-center", children: errors.smsCode }))] }), _jsx("div", { className: "text-center", children: smsCountdown > 0 ? (_jsxs("p", { className: "text-sm text-gray-600", children: [t('registration.activation.resendIn', 'Повторная отправка через'), " ", smsCountdown, " ", t('registration.activation.seconds', 'сек')] })) : (_jsx(Button, { type: "button", onClick: sendSMSVerification, disabled: isLoading, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-4 py-2 rounded-md font-medium text-sm transition-colors", children: t('registration.activation.resendSMS', 'Отправить код повторно') })) }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4 border border-gray-200", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-gray-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-gray-800", children: [_jsx("p", { className: "font-medium mb-1", children: t('registration.activation.testCode', 'Для тестирования используйте код:') }), _jsx("p", { className: "font-mono text-lg", children: "123456" })] })] }) }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", disabled: !data.smsCode || data.smsCode.length !== 6, children: t('registration.activation.verifyCode', 'Подтвердить код') })] })] }))] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Smartphone, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "SMS \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434 \u0438\u0437 SMS \u0434\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0414\u0432\u0443\u0445\u0444\u0430\u043A\u0442\u043E\u0440\u043D\u0430\u044F \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0417\u0430\u0449\u0438\u0442\u0430 \u043E\u0442 \u043C\u043E\u0448\u0435\u043D\u043D\u0438\u0447\u0435\u0441\u0442\u0432\u0430" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F" })] })] })] }) }) }) })] }));
    }
    // Шаг 3: Принятие условий
    if (step === 'terms') {
        return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.activation.termsTitle', 'Последний шаг!') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.activation.termsSubtitle', 'Ознакомьтесь с условиями использования') })] }), _jsxs("form", { onSubmit: handleFinalSubmit, className: "space-y-6", children: [_jsxs("div", { className: "bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto border border-gray-200", children: [_jsx("h3", { className: "font-semibold mb-4 text-gray-900", children: t('registration.activation.termsOfService', 'Условия использования Beauty Platform') }), _jsxs("div", { className: "text-sm text-gray-700 space-y-2", children: [_jsxs("p", { children: ["1. ", t('registration.activation.term1', 'Вы получаете доступ к системе управления салоном красоты')] }), _jsxs("p", { children: ["2. ", t('registration.activation.term2', 'Персональные данные защищены согласно GDPR')] }), _jsxs("p", { children: ["3. ", t('registration.activation.term3', 'Оплата производится ежемесячно согласно выбранному тарифу')] }), _jsxs("p", { children: ["4. ", t('registration.activation.term4', 'Отмена подписки возможна в любое время')] }), _jsxs("p", { children: ["5. ", t('registration.activation.term5', 'Техническая поддержка доступна в рабочие часы')] })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "flex items-start space-x-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: data.acceptTerms, onChange: (e) => handleInputChange('acceptTerms', e.target.checked), className: "mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" }), _jsxs("span", { className: "text-sm text-gray-700", children: [t('registration.activation.acceptTerms', 'Я принимаю'), _jsx("a", { href: "/terms", target: "_blank", className: "text-gray-900 hover:underline mx-1 font-medium", children: t('registration.activation.termsLink', 'условия использования') }), t('registration.activation.and', 'и'), _jsx("a", { href: "/privacy", target: "_blank", className: "text-gray-900 hover:underline ml-1 font-medium", children: t('registration.activation.privacyLink', 'политику конфиденциальности') }), _jsx("span", { className: "text-red-500 ml-1", children: "*" })] })] }), _jsxs("label", { className: "flex items-start space-x-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: data.subscribeNewsletter, onChange: (e) => handleInputChange('subscribeNewsletter', e.target.checked), className: "mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" }), _jsx("span", { className: "text-sm text-gray-700", children: t('registration.activation.subscribe', 'Подписаться на новости о новых функциях и обновлениях') })] }), errors.terms && (_jsx("p", { className: "text-sm text-red-500", children: errors.terms }))] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", disabled: !data.acceptTerms, children: t('registration.activation.createSalon', 'Создать салон!') })] })] })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Shield, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u0411\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C \u0438 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u044C" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u0412\u0430\u0448\u0438 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0430\u0434\u0435\u0436\u043D\u043E \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B \u0441\u043E\u0433\u043B\u0430\u0441\u043D\u043E \u043C\u0435\u0436\u0434\u0443\u043D\u0430\u0440\u043E\u0434\u043D\u044B\u043C \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u0430\u043C" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "GDPR \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0428\u0438\u0444\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0445" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u044F" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041E\u0442\u043C\u0435\u043D\u0430 \u0432 \u043B\u044E\u0431\u043E\u0435 \u0432\u0440\u0435\u043C\u044F" })] })] })] }) }) }) })] }));
    }
    // Шаг 4: Создание аккаунта
    return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.activation.creating', 'Создаем ваш салон...') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.activation.creatingSubtitle', 'Настраиваем систему под ваши потребности') })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-gray-50 rounded-lg p-6 border border-gray-200", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-5 h-5 text-gray-900" }) }), _jsx("span", { className: "text-gray-900 font-medium", children: t('registration.activation.step1', 'Создание пользователя') })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "w-5 h-5 text-gray-900" }) }), _jsx("span", { className: "text-gray-900 font-medium", children: t('registration.activation.step2', 'Настройка салона') })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "text-gray-900 font-medium", children: t('registration.activation.step3', 'Подготовка рабочего места') })] })] }) }), _jsx("div", { className: "text-center", children: _jsx("p", { className: "text-sm text-gray-600", children: t('registration.activation.waitMessage', 'Это займет всего несколько секунд...') }) })] })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Sparkles, { className: "w-24 h-24 mx-auto mb-6 opacity-80 animate-pulse" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u041F\u043E\u0447\u0442\u0438 \u0433\u043E\u0442\u043E\u0432\u043E!" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0448\u0442\u0440\u0438\u0445\u0438... \u0412\u0430\u0448 \u0441\u0430\u043B\u043E\u043D \u0431\u0443\u0434\u0435\u0442 \u0433\u043E\u0442\u043E\u0432 \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434!" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044F" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430 \u0434\u0430\u043D\u043D\u044B\u0445" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-5 h-5 mr-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "\u0424\u0438\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430" })] })] })] }) }) }) })] }));
};
export default StepActivation;
