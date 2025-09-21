import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepOwnerData from './steps/StepOwnerData';
import StepSalonData from './steps/StepSalonData';
import StepLocation from './steps/StepLocation';
import StepServices from './steps/StepServices';
import StepPricing from './steps/StepPricing';
import StepActivation from './steps/StepActivation';
const MultiStepRegistration = () => {
    const { step } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [registrationData, setRegistrationData] = useState({
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
            const stepNumber = stepMapping[step];
            if (stepNumber) {
                setCurrentStep(stepNumber);
            }
            else {
                // Попробуем парсить как цифру для обратной совместимости
                const numStep = parseInt(step);
                if (numStep >= 1 && numStep <= 6) {
                    setCurrentStep(numStep);
                    navigate(`/register/${stepNames[numStep]}`, { replace: true });
                }
                else {
                    navigate('/register/owner', { replace: true });
                }
            }
        }
        else {
            navigate('/register/owner', { replace: true });
        }
    }, [step, navigate]);
    const updateRegistrationData = (data) => {
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
                return (_jsx(StepOwnerData, { data: registrationData, updateData: updateRegistrationData, onNext: goToNextStep }));
            case 2:
                return (_jsx(StepSalonData, { data: registrationData, updateData: updateRegistrationData, onNext: goToNextStep, onPrevious: goToPreviousStep }));
            case 3:
                return (_jsx(StepLocation, { data: registrationData, updateData: updateRegistrationData, onNext: goToNextStep, onPrevious: goToPreviousStep }));
            case 4:
                return (_jsx(StepServices, { data: registrationData, updateData: updateRegistrationData, onNext: goToNextStep, onPrevious: goToPreviousStep }));
            case 5:
                return (_jsx(StepPricing, { data: registrationData, updateData: updateRegistrationData, onNext: goToNextStep, onPrevious: goToPreviousStep }));
            case 6:
                return (_jsx(StepActivation, { data: registrationData, updateData: updateRegistrationData, onPrevious: goToPreviousStep }));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "min-h-screen", children: renderCurrentStep() }));
};
export default MultiStepRegistration;
