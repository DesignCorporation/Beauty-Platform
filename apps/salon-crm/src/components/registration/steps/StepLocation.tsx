import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { MapPin, ArrowLeft, Globe, DollarSign } from 'lucide-react';
import { RegistrationData } from '../MultiStepRegistration';

interface StepLocationProps {
  data: RegistrationData;
  updateData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface FormErrors {
  country?: string;
  street?: string;
  city?: string;
  postalCode?: string;
}

const StepLocation: React.FC<StepLocationProps> = ({ data, updateData, onNext, onPrevious }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<FormErrors>({});
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
          const detectedCountry = countries.find(c => 
            c.name === locationData.country_name || 
            c.code === locationData.country_code
          );
          
          if (detectedCountry) {
            updateData({ 
              country: detectedCountry.name,
              currency: detectedCountry.currency as any
            });
          } else {
            // Fallback к Poland если страна не поддерживается
            updateData({ 
              country: 'Poland',
              currency: 'PLN'
            });
          }
        }
      } catch (error) {
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
        updateData({ currency: selectedCountry.currency as any });
      }
    }
  }, [data.country]);

  // Показать форму адреса для стационарных салонов
  useEffect(() => {
    setShowAddressForm(data.businessType === 'salon');
  }, [data.businessType]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Имитируем геокодирование адреса
      await new Promise(resolve => setTimeout(resolve, 1000));
      onNext();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    updateData({ country: countryName });
    
    // Очищаем ошибку
    if (errors.country) {
      setErrors(prev => ({ ...prev, country: undefined }));
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    const currentAddress = data.address || { street: '', city: '', postalCode: '' };
    updateData({
      address: {
        ...currentAddress,
        [field]: value
      }
    });
    
    // Очищаем ошибку
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCurrencyChange = (currencyCode: 'PLN' | 'EUR' | 'USD' | 'UAH') => {
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

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Левая колонка - Форма */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Заголовок */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Beauty Platform
            </h1>
            <h2 className="mt-6 text-2xl font-semibold text-gray-900">
              {getCountryQuestion()}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('registration.location.subtitle', 'Это поможет настроить валюту и локальные особенности')}
            </p>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Выбор страны */}
        <div className="space-y-2">
          <Label>
            <Globe className="w-4 h-4 inline mr-2" />
            {t('registration.location.country', 'Страна')} <span className="text-red-500">*</span>
          </Label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {countries.map((country) => {
              const isSelected = data.country === country.name;
              
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryChange(country.name)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <div className={`font-medium ${
                        isSelected ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {country.localName}
                      </div>
                      <div className={`text-sm ${
                        isSelected ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {country.name}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {errors.country && (
            <p className="text-sm text-red-500">{errors.country}</p>
          )}
        </div>

        {/* Валюта */}
        {data.country && (
          <div className="space-y-2">
            <Label>
              <DollarSign className="w-4 h-4 inline mr-2" />
              {t('registration.location.currency', 'Валюта')}
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currencies.map((currency) => {
                const isSelected = data.currency === currency.code;
                const isRecommended = data.country && 
                  countries.find(c => c.name === data.country)?.currency === currency.code;
                
                return (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => handleCurrencyChange(currency.code as any)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 text-center relative ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isRecommended && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {t('registration.location.recommended', 'Рекомендуем')}
                      </div>
                    )}
                    
                    <div className="text-2xl mb-1">{currency.flag}</div>
                    <div className={`font-medium ${
                      isSelected ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {currency.symbol} {currency.code}
                    </div>
                    <div className={`text-sm ${
                      isSelected ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {currency.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Адрес (только для стационарных салонов) */}
        {showAddressForm && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">
              {t('registration.location.addressTitle', 'Адрес салона')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">
                  {t('registration.location.street', 'Улица и номер дома')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  type="text"
                  value={data.address?.street || ''}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  placeholder={t('registration.location.streetPlaceholder', 'ул. Красивая, 15')}
                  className={errors.street ? 'border-red-500' : ''}
                />
                {errors.street && (
                  <p className="text-sm text-red-500">{errors.street}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">
                  {t('registration.location.city', 'Город')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={data.address?.city || ''}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder={t('registration.location.cityPlaceholder', 'Варшава')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  {t('registration.location.postalCode', 'Почтовый индекс')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  value={data.address?.postalCode || ''}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder={t('registration.location.postalCodePlaceholder', '00-001')}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-500">{errors.postalCode}</p>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              {t('registration.location.addressNote', 'Точный адрес поможет клиентам легко найти ваш салон')}
            </p>
          </div>
        )}

            {/* Кнопки навигации */}
            <div className="flex space-x-4">
              <Button
                type="button"
                onClick={onPrevious}
                className="bg-white text-gray-900 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200"
              >
                {t('registration.back', 'Назад')}
              </Button>
              
              <Button
                type="submit"
                className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t('registration.processing', 'Обрабатываем...')}
                  </div>
                ) : (
                  t('registration.continue', 'Продолжить')
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Правая колонка - Контент */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center text-white">
              <MapPin className="w-24 h-24 mx-auto mb-6 opacity-80" />
              <h3 className="text-3xl font-bold mb-4">
                Укажите ваше местоположение
              </h3>
              <p className="text-lg opacity-90 mb-8">
                Это поможет настроить валюту и локальные функции
              </p>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                <div className="flex items-center">
                  <Globe className="w-5 h-5 mr-3 text-green-400" />
                  <span>Автоматическая валюта</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-green-400" />
                  <span>Локальные настройки</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-green-400" />
                  <span>Правильное форматирование цен</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepLocation;