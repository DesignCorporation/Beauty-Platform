import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@beauty-platform/ui';
import { Scissors, Sparkles, Eye, Waves, Palette, Zap, Syringe, Heart, Users, User, Building2, Factory, CheckCircle } from 'lucide-react';
const StepServices = ({ data, updateData, onNext, onPrevious }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const serviceCategories = [
        {
            id: 'hair',
            icon: Scissors,
            emoji: '💇‍♀️',
            title: t('registration.services.categories.hair.title', 'Парикмахерские услуги'),
            description: t('registration.services.categories.hair.description', 'Стрижки, укладки, окрашивание'),
            popular: true
        },
        {
            id: 'nails',
            icon: Sparkles,
            emoji: '💅',
            title: t('registration.services.categories.nails.title', 'Маникюр и педикюр'),
            description: t('registration.services.categories.nails.description', 'Уход за ногтями, дизайн'),
            popular: true
        },
        {
            id: 'brows',
            icon: Eye,
            emoji: '👁️',
            title: t('registration.services.categories.brows.title', 'Брови и ресницы'),
            description: t('registration.services.categories.brows.description', 'Коррекция, окрашивание, наращивание'),
            popular: true
        },
        {
            id: 'massage',
            icon: Waves,
            emoji: '💆‍♀️',
            title: t('registration.services.categories.massage.title', 'Массаж и SPA'),
            description: t('registration.services.categories.massage.description', 'Релаксация, уход за телом'),
            popular: false
        },
        {
            id: 'makeup',
            icon: Palette,
            emoji: '💄',
            title: t('registration.services.categories.makeup.title', 'Визаж и макияж'),
            description: t('registration.services.categories.makeup.description', 'Вечерний, свадебный макияж'),
            popular: false
        },
        {
            id: 'cosmetology',
            icon: Zap,
            emoji: '🧴',
            title: t('registration.services.categories.cosmetology.title', 'Косметология'),
            description: t('registration.services.categories.cosmetology.description', 'Чистки, пилинги, уходы'),
            popular: false
        },
        {
            id: 'aesthetic',
            icon: Syringe,
            emoji: '💉',
            title: t('registration.services.categories.aesthetic.title', 'Эстетическая медицина'),
            description: t('registration.services.categories.aesthetic.description', 'Инъекции, контурная пластика'),
            popular: false
        },
        {
            id: 'fitness',
            icon: Heart,
            emoji: '🧘‍♀️',
            title: t('registration.services.categories.fitness.title', 'Фитнес и йога'),
            description: t('registration.services.categories.fitness.description', 'Персональные тренировки, йога'),
            popular: false
        }
    ];
    const teamSizes = [
        {
            id: 'solo',
            icon: User,
            title: t('registration.services.teamSizes.solo.title', 'Я работаю один'),
            description: t('registration.services.teamSizes.solo.description', 'Индивидуальный предприниматель'),
            emoji: '👤'
        },
        {
            id: 'small',
            icon: Users,
            title: t('registration.services.teamSizes.small.title', 'У меня есть команда 2-5 человек'),
            description: t('registration.services.teamSizes.small.description', 'Небольшая команда мастеров'),
            emoji: '👥'
        },
        {
            id: 'medium',
            icon: Building2,
            title: t('registration.services.teamSizes.medium.title', 'Средний салон 6-15 человек'),
            description: t('registration.services.teamSizes.medium.description', 'Полноценный салон красоты'),
            emoji: '🏢'
        },
        {
            id: 'large',
            icon: Factory,
            title: t('registration.services.teamSizes.large.title', 'Крупный салон 16+ человек'),
            description: t('registration.services.teamSizes.large.description', 'Сеть салонов или большой центр'),
            emoji: '🏭'
        }
    ];
    const validateForm = () => {
        const newErrors = {};
        if (data.serviceCategories.length === 0) {
            newErrors.serviceCategories = t('registration.validation.serviceCategoriesRequired', 'Выберите хотя бы одну категорию услуг');
        }
        else if (data.serviceCategories.length > 5) {
            newErrors.serviceCategories = t('registration.validation.serviceCategoriesMax', 'Выберите не более 5 категорий');
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
    const toggleServiceCategory = (categoryId) => {
        const currentCategories = data.serviceCategories;
        const isSelected = currentCategories.includes(categoryId);
        let newCategories;
        if (isSelected) {
            newCategories = currentCategories.filter(id => id !== categoryId);
        }
        else {
            if (currentCategories.length < 5) {
                newCategories = [...currentCategories, categoryId];
            }
            else {
                return; // Максимум 5 категорий
            }
        }
        updateData({ serviceCategories: newCategories });
        // Очищаем ошибку при изменении
        if (errors.serviceCategories) {
            setErrors(prev => ({ ...prev, serviceCategories: undefined }));
        }
    };
    const handleTeamSizeChange = (teamSize) => {
        updateData({ teamSize });
    };
    return (_jsxs("div", { className: "grid min-h-screen lg:grid-cols-2", children: [_jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-lg space-y-8", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight text-gray-900", children: "Beauty Platform" }), _jsx("h2", { className: "mt-6 text-2xl font-semibold text-gray-900", children: t('registration.services.title', 'Какие услуги вы предоставляете?') }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: t('registration.services.subtitle', 'Выберите до 5 основных направлений вашего бизнеса') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('registration.services.popular', 'Популярные услуги') }), _jsxs("div", { className: "text-sm text-gray-600", children: [data.serviceCategories.length, "/5"] })] }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: serviceCategories.filter(cat => cat.popular).map((category) => {
                                                const IconComponent = category.icon;
                                                const isSelected = data.serviceCategories.includes(category.id);
                                                const isDisabled = !isSelected && data.serviceCategories.length >= 5;
                                                return (_jsx("button", { type: "button", onClick: () => !isDisabled && toggleServiceCategory(category.id), disabled: isDisabled, className: `p-4 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                                                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                                                        : isDisabled
                                                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: `p-2 rounded-lg ${isSelected ? 'bg-gray-100' : 'bg-gray-100'}`, children: _jsx(IconComponent, { className: `w-5 h-5 ${isSelected ? 'text-gray-900' : 'text-gray-600'}` }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: `font-medium ${isSelected ? 'text-gray-900' : 'text-gray-900'}`, children: category.title }), _jsx("p", { className: `text-sm ${isSelected ? 'text-gray-600' : 'text-gray-600'}`, children: category.description })] }), isSelected && (_jsx("div", { className: "w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }))] }) }, category.id));
                                            }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('registration.services.other', 'Другие направления') }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: serviceCategories.filter(cat => !cat.popular).map((category) => {
                                                const IconComponent = category.icon;
                                                const isSelected = data.serviceCategories.includes(category.id);
                                                const isDisabled = !isSelected && data.serviceCategories.length >= 5;
                                                return (_jsx("button", { type: "button", onClick: () => !isDisabled && toggleServiceCategory(category.id), disabled: isDisabled, className: `p-3 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                                                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                                                        : isDisabled
                                                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                            : 'border-gray-300 hover:border-gray-400'}`, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(IconComponent, { className: `w-4 h-4 ${isSelected ? 'text-gray-900' : 'text-gray-600'}` }), _jsx("h3", { className: `font-medium text-sm ${isSelected ? 'text-gray-900' : 'text-gray-900'}`, children: category.title }), isSelected && (_jsx("div", { className: "w-3 h-3 bg-gray-900 rounded-full flex items-center justify-center ml-auto", children: _jsx("div", { className: "w-1 h-1 bg-white rounded-full" }) }))] }) }, category.id));
                                            }) })] }), errors.serviceCategories && (_jsx("p", { className: "text-sm text-red-500", children: errors.serviceCategories })), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('registration.services.teamSizeTitle', 'Размер вашей команды') }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: teamSizes.map((team) => {
                                                const IconComponent = team.icon;
                                                const isSelected = data.teamSize === team.id;
                                                return (_jsx("button", { type: "button", onClick: () => handleTeamSizeChange(team.id), className: `p-4 rounded-lg border-2 transition-all duration-200 text-left ${isSelected
                                                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                                                        : 'border-gray-300 hover:border-gray-400'}`, children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "p-2 rounded-lg bg-gray-100", children: _jsx(IconComponent, { className: `w-5 h-5 ${isSelected ? 'text-gray-900' : 'text-gray-600'}` }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-gray-900", children: team.title }), _jsx("p", { className: "text-sm text-gray-600", children: team.description })] }), isSelected && (_jsx("div", { className: "w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center", children: _jsx("div", { className: "w-2 h-2 bg-white rounded-full" }) }))] }) }, team.id));
                                            }) })] }), _jsxs("div", { className: "flex space-x-4", children: [_jsx(Button, { type: "button", onClick: onPrevious, className: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", children: t('registration.back', 'Назад') }), _jsx(Button, { type: "submit", className: "flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors", disabled: isLoading || data.serviceCategories.length === 0, children: isLoading ? (_jsxs("div", { className: "flex items-center justify-center", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), t('registration.saving', 'Сохраняем...')] })) : (t('registration.continue', 'Продолжить')) })] })] })] }) }), _jsx("div", { className: "hidden lg:block relative", children: _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700", children: _jsx("div", { className: "flex items-center justify-center h-full p-12", children: _jsxs("div", { className: "text-center text-white", children: [_jsx(Scissors, { className: "w-24 h-24 mx-auto mb-6 opacity-80" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0448\u0438 \u0443\u0441\u043B\u0443\u0433\u0438" }), _jsx("p", { className: "text-lg opacity-90 mb-8", children: "\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u0441\u044F \u043F\u043E\u0434 \u0432\u0430\u0448 \u0431\u0438\u0437\u043D\u0435\u0441 \u0438 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u044D\u0444\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u043E \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0441\u0430\u043B\u043E\u043D\u043E\u043C" }), _jsxs("div", { className: "space-y-3 text-left max-w-sm mx-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0441\u043B\u0443\u0433" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C" })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 mr-3 text-green-400" }), _jsx("span", { children: "\u0413\u043E\u0442\u043E\u0432\u044B\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F" })] })] })] }) }) }) })] }));
};
export default StepServices;
