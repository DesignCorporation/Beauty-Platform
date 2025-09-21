import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@beauty-platform/ui';
import { Crown, Users, Building2, Factory, Check } from 'lucide-react';
const StepPricing = ({ data, updateData, onNext, onPrevious }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const currencySymbol = data.currency === 'PLN' ? 'zł' :
        data.currency === 'USD' ? '$' :
            data.currency === 'UAH' ? '₴' : '€';
    const pricingPlans = [
        {
            id: 'starter',
            icon: Crown,
            name: t('registration.pricing.plans.starter.name', 'STARTER'),
            subtitle: t('registration.pricing.plans.starter.subtitle', 'Для начинающих'),
            price: t('registration.pricing.plans.starter.price', 'Бесплатно'),
            priceAfterTrial: `20${currencySymbol}`,
            trialDays: 7,
            popular: false,
            recommended: false,
            features: [
                t('registration.pricing.plans.starter.features.team', '1 владелец + до 2 мастеров'),
                t('registration.pricing.plans.starter.features.calendar', 'Базовый календарь записей'),
                t('registration.pricing.plans.starter.features.clients', 'До 50 клиентов'),
                t('registration.pricing.plans.starter.features.support', 'Email поддержка')
            ]
        },
        {
            id: 'team',
            icon: Users,
            name: t('registration.pricing.plans.team.name', 'TEAM'),
            subtitle: t('registration.pricing.plans.team.subtitle', 'Для команд'),
            price: `20${currencySymbol}`,
            trialDays: 7,
            popular: true,
            recommended: false,
            features: [
                t('registration.pricing.plans.team.features.team', 'До 5 сотрудников'),
                t('registration.pricing.plans.team.features.calendar', 'Полный календарь'),
                t('registration.pricing.plans.team.features.clients', 'Неограниченно клиентов'),
                t('registration.pricing.plans.team.features.sms', 'SMS уведомления'),
                t('registration.pricing.plans.team.features.analytics', 'Базовая аналитика'),
                t('registration.pricing.plans.team.features.support', 'Приоритетная поддержка')
            ]
        },
        {
            id: 'business',
            icon: Building2,
            name: t('registration.pricing.plans.business.name', 'BUSINESS'),
            subtitle: t('registration.pricing.plans.business.subtitle', 'Для салонов'),
            price: `50${currencySymbol}`,
            trialDays: 7,
            popular: false,
            recommended: true,
            features: [
                t('registration.pricing.plans.business.features.team', 'До 10 сотрудников'),
                t('registration.pricing.plans.business.features.analytics', 'Продвинутая аналитика'),
                t('registration.pricing.plans.business.features.social', 'Интеграции с соцсетями'),
                t('registration.pricing.plans.business.features.booking', 'Онлайн запись для клиентов'),
                t('registration.pricing.plans.business.features.multi', 'Многофилиальность'),
                t('registration.pricing.plans.business.features.crm', 'Расширенная CRM')
            ]
        },
        {
            id: 'enterprise',
            icon: Factory,
            name: t('registration.pricing.plans.enterprise.name', 'ENTERPRISE'),
            subtitle: t('registration.pricing.plans.enterprise.subtitle', 'Для сетей'),
            price: `70${currencySymbol}`,
            trialDays: 7,
            popular: false,
            recommended: false,
            features: [
                t('registration.pricing.plans.enterprise.features.team', 'До 25 сотрудников'),
                t('registration.pricing.plans.enterprise.features.api', 'API доступ'),
                t('registration.pricing.plans.enterprise.features.manager', 'Персональный менеджер'),
                t('registration.pricing.plans.enterprise.features.integrations', 'Кастомные интеграции'),
                t('registration.pricing.plans.enterprise.features.whitelabel', 'White-label решения'),
                t('registration.pricing.plans.enterprise.features.priority', 'Приоритетная поддержка 24/7')
            ]
        }
    ];
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            onNext();
        }
        catch (error) {
            console.error('Ошибка сохранения тарифа:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handlePlanSelect = (planType) => {
        updateData({ planType, trialPeriod: true });
    };
    const getRecommendedPlan = () => {
        switch (data.teamSize) {
            case 'solo':
                return 'starter';
            case 'small':
                return 'team';
            case 'medium':
                return 'business';
            case 'large':
                return 'enterprise';
            default:
                return 'team';
        }
    };
    const recommendedPlan = getRecommendedPlan();
    return (_jsx("div", { className: "min-h-screen", children: _jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-6xl space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.pricing.title', 'Выберите тарифный план') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.pricing.subtitle', 'Начните с бесплатного периода 7 дней') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: pricingPlans.map((plan) => {
                                    const IconComponent = plan.icon;
                                    const isSelected = data.planType === plan.id;
                                    const isRecommended = plan.id === recommendedPlan;
                                    return (_jsxs("div", { className: `relative rounded-lg border-2 transition-all duration-200 cursor-pointer h-full ${isSelected
                                            ? 'border-gray-900 bg-gray-50 shadow-sm'
                                            : 'border-gray-300 hover:border-gray-400'}`, onClick: () => handlePlanSelect(plan.id), children: [(plan.popular || isRecommended) && (_jsx("div", { className: "absolute -top-2 left-4", children: _jsxs("div", { className: "bg-gray-900 text-white text-xs px-2 py-1 rounded", children: [plan.popular && t('registration.pricing.popular', 'Популярный'), isRecommended && !plan.popular && t('registration.pricing.recommended', 'Рекомендуем')] }) })), _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "p-3 bg-gray-100 rounded-lg", children: _jsx(IconComponent, { className: "w-6 h-6 text-gray-900" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: plan.name }), _jsx("p", { className: "text-sm text-gray-600", children: plan.subtitle }), _jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-2xl font-bold text-gray-900", children: plan.price }), plan.id !== 'starter' && (_jsxs("span", { className: "text-gray-600 text-sm ml-1", children: ["/ ", t('registration.pricing.month', 'мес')] })), plan.id === 'starter' && (_jsxs("div", { className: "text-sm text-gray-600", children: [t('registration.pricing.thenPrice', 'потом'), " ", plan.priceAfterTrial, "/", t('registration.pricing.month', 'мес')] }))] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: t('registration.pricing.freeTrial', '7 дней бесплатно') })] })] }), isSelected && (_jsx("div", { className: "w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }))] }), _jsxs("div", { className: "mt-4 space-y-2", children: [plan.features.slice(0, 3).map((feature, index) => (_jsxs("div", { className: "flex items-center text-sm text-gray-600", children: [_jsx(Check, { className: "w-4 h-4 mr-2 text-gray-400" }), _jsx("span", { children: feature })] }, index))), plan.features.length > 3 && (_jsxs("div", { className: "text-xs text-gray-500", children: ["+", plan.features.length - 3, " \u0434\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u0444\u0443\u043D\u043A\u0446\u0438\u0439"] }))] })] })] }, plan.id));
                                }) }), data.planType && (_jsxs("div", { className: "bg-gray-50 rounded-lg p-4 border border-gray-200", children: [_jsxs("h3", { className: "font-medium text-gray-900 mb-1", children: [t('registration.pricing.selectedPlan', 'Выбран план'), ": ", pricingPlans.find(p => p.id === data.planType)?.name] }), _jsx("p", { className: "text-gray-600 text-sm", children: t('registration.pricing.planInfo', '7 дней бесплатно. Отмена в любое время.') })] })), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", disabled: isLoading || !data.planType, children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.processing', 'Обрабатываем...')] })) : (t('registration.pricing.startTrial', 'Начать бесплатный период')) })] })] }), _jsx("div", { className: "text-center text-xs text-gray-500", children: t('registration.pricing.noCommitment', 'Никаких обязательств. Отмена в один клик.') })] }) }) }));
};
export default StepPricing;
