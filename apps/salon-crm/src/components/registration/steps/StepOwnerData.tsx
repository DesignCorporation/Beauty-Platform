import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Button, 
  Input, 
  Label
} from '@beauty-platform/ui';
import { Mail, Phone, Globe } from 'lucide-react';
import { RegistrationData } from '../MultiStepRegistration';
import { detectUserCountry, CountryInfo, COUNTRIES, getAllCountries, formatPhoneWithCountryCode } from '../../../utils/country-detection';

interface StepOwnerDataProps {
  data: RegistrationData;
  updateData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const StepOwnerData: React.FC<StepOwnerDataProps> = ({ data, updateData, onNext }) => {
  const { t, i18n } = useTranslation();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);

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
      } catch (error) {
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Валидация имени
    if (!data.firstName.trim()) {
      newErrors.firstName = t('registration.validation.firstNameRequired', 'Имя обязательно');
    } else if (data.firstName.trim().length < 2) {
      newErrors.firstName = t('registration.validation.firstNameTooShort', 'Имя должно содержать минимум 2 символа');
    }

    // Валидация фамилии
    if (!data.lastName.trim()) {
      newErrors.lastName = t('registration.validation.lastNameRequired', 'Фамилия обязательна');
    } else if (data.lastName.trim().length < 2) {
      newErrors.lastName = t('registration.validation.lastNameTooShort', 'Фамилия должна содержать минимум 2 символа');
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) {
      newErrors.email = t('registration.validation.emailRequired', 'Email обязателен');
    } else if (!emailRegex.test(data.email)) {
      newErrors.email = t('registration.validation.emailInvalid', 'Введите корректный email');
    }

    // Валидация телефона
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!data.phone.trim()) {
      newErrors.phone = t('registration.validation.phoneRequired', 'Телефон обязателен');
    } else if (!phoneRegex.test(data.phone)) {
      newErrors.phone = t('registration.validation.phoneInvalid', 'Введите корректный номер телефона');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (error) {
      console.error('Ошибка валидации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    updateData({ [field]: value });
    
    // Очищаем ошибку при изменении поля
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLanguageChange = (langCode: string) => {
    updateData({ language: langCode as 'en' | 'pl' | 'ua' | 'ru' });
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="min-h-screen">
      {/* Форма на всю ширину */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Переключатель языка */}
          <div className="flex justify-end">
            <div className="w-40">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                <select 
                  value={data.language} 
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Заголовок */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Beauty Platform
            </h1>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              {t('registration.owner.title', 'Расскажите о себе')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('registration.owner.subtitle', 'Эта информация нужна для создания вашего аккаунта')}
            </p>
          </div>

          {/* Форма */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Имя и Фамилия в одну строку */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      {t('registration.owner.firstName', 'Имя')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={data.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder={t('registration.owner.firstNamePlaceholder', 'Введите ваше имя')}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      autoFocus
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      {t('registration.owner.lastName', 'Фамилия')} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={data.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder={t('registration.owner.lastNamePlaceholder', 'Введите вашу фамилию')}
                      className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('registration.owner.email', 'Email')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={data.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={t('registration.owner.emailPlaceholder', 'your@email.com')}
                      className={`pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    {t('registration.owner.emailNote', 'Этот email будет использоваться для входа в систему')}
                  </p>
                </div>

                {/* Телефон с выбором страны */}
                <div>
                  <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    {t('registration.owner.phone', 'Телефон')} <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1 flex gap-2">
                    {/* Селектор страны */}
                    <div className="w-32">
                      <select 
                        value={selectedCountry?.code || 'PL'}
                        onChange={(e) => {
                          const country = COUNTRIES[e.target.value];
                          if (country) {
                            setSelectedCountry(country);
                            // Обновляем код телефона
                            const currentNumber = data.phone.replace(/^\+\d+\s*/, '');
                            updateData({ phone: country.phoneCode + ' ' + currentNumber });
                          }
                        }}
                        className="w-full px-2 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      >
                        {getAllCountries().map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.flag} {country.phoneCode}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Поле номера */}
                    <div className="flex-1 relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={data.phone}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Автоматически форматируем номер с кодом страны
                          if (selectedCountry && !value.startsWith('+')) {
                            value = formatPhoneWithCountryCode(value, selectedCountry);
                          }
                          handleInputChange('phone', value);
                        }}
                        placeholder={selectedCountry ? `${selectedCountry.phoneCode} 123 456 789` : '+48 123 456 789'}
                        className={`pl-10 block w-full border-gray-300 rounded-r-md shadow-sm focus:ring-gray-900 focus:border-gray-900 ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      />
                    </div>
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <p>{t('registration.owner.phoneNote', 'Понадобится для SMS подтверждения')}</p>
                    {detectedCountry && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {detectedCountry.flag} {t('registration.owner.autoDetected', 'Автоопределено')}
                      </span>
                    )}
                  </div>
                </div>
              </div>


              {/* Кнопка продолжить */}
              <div>
                <Button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('registration.owner.checking', 'Проверяем данные...')}
                    </div>
                  ) : (
                    t('registration.continue', 'Продолжить')
                  )}
                </Button>
              </div>
            </form>

            {/* Дополнительная информация */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {t('registration.owner.privacy', 'Регистрируясь, вы соглашаетесь с нашими условиями использования и политикой конфиденциальности')}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default StepOwnerData;