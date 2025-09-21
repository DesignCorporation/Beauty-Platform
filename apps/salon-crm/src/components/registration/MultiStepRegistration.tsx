import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import ProgressBar from './ProgressBar';
import StepOwnerData from './steps/StepOwnerData';
import StepSalonData from './steps/StepSalonData';
import StepLocation from './steps/StepLocation';
import StepServices from './steps/StepServices';
import StepPricing from './steps/StepPricing';
import StepActivation from './steps/StepActivation';

export interface RegistrationData {
  // Шаг 1: Данные владельца
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: 'en' | 'pl' | 'ua' | 'ru';
  
  // Шаг 2: Данные салона
  salonName: string;
  website?: string;
  businessType: 'salon' | 'mobile' | 'home' | 'online';
  
  // Шаг 3: Локация и валюта
  country: string;
  currency: 'PLN' | 'EUR' | 'USD' | 'UAH';
  address?: {
    street: string;
    city: string;
    postalCode: string;
    coordinates?: { lat: number; lng: number };
  };
  
  // Шаг 4: Услуги и команда
  serviceCategories: string[];
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  
  // Шаг 5: Тарифный план
  planType: 'starter' | 'team' | 'business' | 'enterprise';
  trialPeriod: boolean;
  
  // Шаг 6: Активация
  emailToken?: string;
  smsCode?: string;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

const MultiStepRegistration: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    language: 'en',
    salonName: '',
    businessType: 'salon',
    country: '',
    currency: 'EUR',
    serviceCategories: [],
    teamSize: 'solo',
    planType: 'starter',
    trialPeriod: true,
    acceptTerms: false,
    subscribeNewsletter: true,
  });

  // Маппинг URL названий на номера шагов
  const stepMapping = {
    'owner': 1,
    'salon': 2, 
    'location': 3,
    'services': 4,
    'pricing': 5,
    'activation': 6
  };

  const stepNames = ['', 'owner', 'salon', 'location', 'services', 'pricing', 'activation'];

  // Парсинг шага из URL
  useEffect(() => {
    if (step) {
      const stepNumber = stepMapping[step as keyof typeof stepMapping];
      if (stepNumber) {
        setCurrentStep(stepNumber);
      } else {
        // Попробуем парсить как цифру для обратной совместимости
        const numStep = parseInt(step);
        if (numStep >= 1 && numStep <= 6) {
          setCurrentStep(numStep);
          navigate(`/register/${stepNames[numStep]}`, { replace: true });
        } else {
          navigate('/register/owner', { replace: true });
        }
      }
    } else {
      navigate('/register/owner', { replace: true });
    }
  }, [step, navigate]);

  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep < 6) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      navigate(`/register/${stepNames[nextStep]}`);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      navigate(`/register/${stepNames[prevStep]}`);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepOwnerData
            data={registrationData}
            updateData={updateRegistrationData}
            onNext={goToNextStep}
          />
        );
      case 2:
        return (
          <StepSalonData
            data={registrationData}
            updateData={updateRegistrationData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 3:
        return (
          <StepLocation
            data={registrationData}
            updateData={updateRegistrationData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 4:
        return (
          <StepServices
            data={registrationData}
            updateData={updateRegistrationData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 5:
        return (
          <StepPricing
            data={registrationData}
            updateData={updateRegistrationData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
          />
        );
      case 6:
        return (
          <StepActivation
            data={registrationData}
            updateData={updateRegistrationData}
            onPrevious={goToPreviousStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Прогресс-бар временно убран */}
      {/* <div className="mb-8">
        <ProgressBar currentStep={currentStep} totalSteps={6} />
      </div> */}

      {/* Основной контент на всю ширину */}
      {renderCurrentStep()}
    </div>
  );
};

export default MultiStepRegistration;