import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
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

  return (
    <div className="w-full">
      {/* Линия прогресса */}
      <div className="relative mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Шаги с иконками */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div 
              key={stepNumber}
              className={`flex flex-col items-center flex-1 min-w-0 ${
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {/* Иконка шага */}
              <div className={`relative mb-2 ${
                isCurrent ? 'scale-110' : ''
              } transition-all duration-300`}>
                {isCompleted ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  </div>
                )}
                
                {/* Анимация текущего шага */}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-pulse" />
                )}
              </div>

              {/* Название шага */}
              <span className={`text-xs text-center font-medium ${
                isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ProgressBar;