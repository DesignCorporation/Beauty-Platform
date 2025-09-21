import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
const ProgressBar = ({ currentStep, totalSteps }) => {
    const { t } = useTranslation();
    const stepLabels = [
        t('registration.steps.owner', 'Владелец'),
        t('registration.steps.salon', 'Салон'),
        t('registration.steps.location', 'Локация'),
        t('registration.steps.services', 'Услуги'),
        t('registration.steps.pricing', 'Тариф'),
        t('registration.steps.activation', 'Активация')
    ];
    const progressPercentage = (currentStep / totalSteps) * 100;
    return (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "relative mb-6", children: _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out", style: { width: `${progressPercentage}%` } }) }) }), _jsx("div", { className: "flex flex-wrap justify-between items-center gap-2", children: stepLabels.map((label, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < currentStep;
                    const isCurrent = stepNumber === currentStep;
                    return (_jsxs("div", { className: `flex flex-col items-center flex-1 min-w-0 ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`, children: [_jsxs("div", { className: `relative mb-2 ${isCurrent ? 'scale-110' : ''} transition-all duration-300`, children: [isCompleted ? (_jsx(CheckCircle, { className: "w-8 h-8 text-green-500" })) : (_jsx("div", { className: `w-8 h-8 rounded-full border-2 flex items-center justify-center ${isCurrent
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-gray-300 text-gray-400'}`, children: _jsx("span", { className: "text-sm font-semibold", children: stepNumber }) })), isCurrent && (_jsx("div", { className: "absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse" }))] }), _jsx("span", { className: `text-xs text-center font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`, children: label })] }, stepNumber));
                }) })] }));
};
export default ProgressBar;
