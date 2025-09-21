import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label } from '@beauty-platform/ui';
import { CheckCircle, Mail, Smartphone, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { RegistrationData } from '../MultiStepRegistration';

interface StepActivationProps {
  data: RegistrationData;
  updateData: (data: Partial<RegistrationData>) => void;
  onPrevious: () => void;
}

interface FormErrors {
  smsCode?: string;
  terms?: string;
}

const StepActivation: React.FC<StepActivationProps> = ({ data, updateData, onPrevious }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [step, setStep] = useState<'email' | 'sms' | 'terms' | 'creating'>('email');

  // Таймер для повторной отправки SMS
  useEffect(() => {
    let timer: NodeJS.Timeout;
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
    } catch (error) {
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
    } catch (error) {
      console.error('Ошибка отправки SMS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSMSCode = (): boolean => {
    const newErrors: FormErrors = {};

    if (!data.smsCode || data.smsCode.length !== 6) {
      newErrors.smsCode = t('registration.validation.smsCodeRequired', 'Введите 6-значный код из SMS');
    } else if (!/^\d{6}$/.test(data.smsCode)) {
      newErrors.smsCode = t('registration.validation.smsCodeInvalid', 'Код должен содержать только цифры');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTerms = (): boolean => {
    const newErrors: FormErrors = {};

    if (!data.acceptTerms) {
      newErrors.terms = t('registration.validation.termsRequired', 'Необходимо принять условия использования');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSMSVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSMSCode()) {
      return;
    }

    // Имитируем проверку SMS кода
    if (data.smsCode === '123456' || data.smsCode === '000000') {
      setStep('terms');
    } else {
      setErrors({ smsCode: t('registration.validation.smsCodeWrong', 'Неверный код. Попробуйте еще раз.') });
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
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
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Ошибка создания аккаунта:', error);
      setIsLoading(false);
      // Можно показать ошибку пользователю
      alert(`Ошибка создания салона: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('terms'); // Вернуться к предыдущему шагу
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    updateData({ [field]: value });
    
    // Очищаем ошибки
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPhone = (phone: string) => {
    // Форматируем телефон для отображения
    return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  };

  // Шаг 1: Отправка email
  if (step === 'email') {
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
                {t('registration.activation.emailTitle', 'Проверяем ваш email')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('registration.activation.emailSubtitle', 'Мы отправили письмо на')} <strong>{data.email}</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-center space-x-2 mb-4">
                {emailSent ? (
                  <CheckCircle className="w-6 h-6 text-gray-900" />
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                )}
                <span className="font-medium text-gray-900">
                  {emailSent 
                    ? t('registration.activation.emailSent', 'Email отправлен!')
                    : t('registration.activation.emailSending', 'Отправляем email...')
                  }
                </span>
              </div>
              
              {emailSent && (
                <p className="text-gray-700 text-sm text-center">
                  {t('registration.activation.emailInstructions', 'Проверьте папку "Спам", если письмо не пришло')}
                </p>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                onClick={onPrevious}
                className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors"
              >
                {t('registration.back', 'Назад')}
              </Button>
            </div>
          </div>
        </div>

        {/* Правая колонка - Изображение/Контент */}
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center text-white">
                <Mail className="w-24 h-24 mx-auto mb-6 opacity-80" />
                <h3 className="text-3xl font-bold mb-4">
                  Проверка email
                </h3>
                <p className="text-lg opacity-90 mb-8">
                  Мы отправили ссылку для подтверждения на ваш email адрес
                </p>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Быстрое подтверждение</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Защищенная верификация</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Автоматический переход</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Шаг 2: SMS верификация
  if (step === 'sms') {
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
                {t('registration.activation.smsTitle', 'Подтвердите номер телефона')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('registration.activation.smsSubtitle', 'Мы отправили код на')} <strong>{formatPhone(data.phone)}</strong>
              </p>
            </div>

            {!smsSent ? (
              <div className="text-center">
                <Button
                  onClick={sendSMSVerification}
                  disabled={isLoading}
                  className="bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-3 rounded-md font-medium transition-colors"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('registration.activation.smsSending', 'Отправляем SMS...')}
                    </div>
                  ) : (
                    t('registration.activation.sendSMS', 'Отправить SMS код')
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSMSVerification} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="smsCode" className="text-center block text-sm font-medium text-gray-700">
                    {t('registration.activation.enterCode', 'Введите код из SMS')}
                  </Label>
                  <Input
                    id="smsCode"
                    type="text"
                    value={data.smsCode || ''}
                    onChange={(e) => handleInputChange('smsCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className={`text-center text-2xl font-mono tracking-widest border-gray-300 focus:ring-gray-900 focus:border-gray-900 ${errors.smsCode ? 'border-red-500' : ''}`}
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  {errors.smsCode && (
                    <p className="text-sm text-red-500 text-center">{errors.smsCode}</p>
                  )}
                </div>

                <div className="text-center">
                  {smsCountdown > 0 ? (
                    <p className="text-sm text-gray-600">
                      {t('registration.activation.resendIn', 'Повторная отправка через')} {smsCountdown} {t('registration.activation.seconds', 'сек')}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      onClick={sendSMSVerification}
                      disabled={isLoading}
                      className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-4 py-2 rounded-md font-medium text-sm transition-colors"
                    >
                      {t('registration.activation.resendSMS', 'Отправить код повторно')}
                    </Button>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="text-sm text-gray-800">
                      <p className="font-medium mb-1">
                        {t('registration.activation.testCode', 'Для тестирования используйте код:')}
                      </p>
                      <p className="font-mono text-lg">123456</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={onPrevious}
                    className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors"
                  >
                    {t('registration.back', 'Назад')}
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors"
                    disabled={!data.smsCode || data.smsCode.length !== 6}
                  >
                    {t('registration.activation.verifyCode', 'Подтвердить код')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Правая колонка - Изображение/Контент */}
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center text-white">
                <Smartphone className="w-24 h-24 mx-auto mb-6 opacity-80" />
                <h3 className="text-3xl font-bold mb-4">
                  SMS подтверждение
                </h3>
                <p className="text-lg opacity-90 mb-8">
                  Введите код из SMS для завершения регистрации
                </p>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Двухфакторная аутентификация</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Защита от мошенничества</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Безопасный доступ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Шаг 3: Принятие условий
  if (step === 'terms') {
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
                {t('registration.activation.termsTitle', 'Последний шаг!')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('registration.activation.termsSubtitle', 'Ознакомьтесь с условиями использования')}
              </p>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 max-h-64 overflow-y-auto border border-gray-200">
                <h3 className="font-semibold mb-4 text-gray-900">
                  {t('registration.activation.termsOfService', 'Условия использования Beauty Platform')}
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>1. {t('registration.activation.term1', 'Вы получаете доступ к системе управления салоном красоты')}</p>
                  <p>2. {t('registration.activation.term2', 'Персональные данные защищены согласно GDPR')}</p>
                  <p>3. {t('registration.activation.term3', 'Оплата производится ежемесячно согласно выбранному тарифу')}</p>
                  <p>4. {t('registration.activation.term4', 'Отмена подписки возможна в любое время')}</p>
                  <p>5. {t('registration.activation.term5', 'Техническая поддержка доступна в рабочие часы')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    {t('registration.activation.acceptTerms', 'Я принимаю')} 
                    <a href="/terms" target="_blank" className="text-gray-900 hover:underline mx-1 font-medium">
                      {t('registration.activation.termsLink', 'условия использования')}
                    </a>
                    {t('registration.activation.and', 'и')}
                    <a href="/privacy" target="_blank" className="text-gray-900 hover:underline ml-1 font-medium">
                      {t('registration.activation.privacyLink', 'политику конфиденциальности')}
                    </a>
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.subscribeNewsletter}
                    onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
                    className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-700">
                    {t('registration.activation.subscribe', 'Подписаться на новости о новых функциях и обновлениях')}
                  </span>
                </label>

                {errors.terms && (
                  <p className="text-sm text-red-500">{errors.terms}</p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  onClick={onPrevious}
                  className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors"
                >
                  {t('registration.back', 'Назад')}
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 px-6 py-2 rounded-md font-medium transition-colors"
                  disabled={!data.acceptTerms}
                >
                  {t('registration.activation.createSalon', 'Создать салон!')}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Правая колонка - Изображение/Контент */}
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
            <div className="flex items-center justify-center h-full p-12">
              <div className="text-center text-white">
                <Shield className="w-24 h-24 mx-auto mb-6 opacity-80" />
                <h3 className="text-3xl font-bold mb-4">
                  Безопасность и конфиденциальность
                </h3>
                <p className="text-lg opacity-90 mb-8">
                  Ваши данные надежно защищены согласно международным стандартам
                </p>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>GDPR соответствие</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Шифрование данных</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Прозрачные условия</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                    <span>Отмена в любое время</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Шаг 4: Создание аккаунта
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
              {t('registration.activation.creating', 'Создаем ваш салон...')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('registration.activation.creatingSubtitle', 'Настраиваем систему под ваши потребности')}
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {t('registration.activation.step1', 'Создание пользователя')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                  </div>
                  <span className="text-gray-900 font-medium">
                    {t('registration.activation.step2', 'Настройка салона')}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-900 font-medium">
                    {t('registration.activation.step3', 'Подготовка рабочего места')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {t('registration.activation.waitMessage', 'Это займет всего несколько секунд...')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Правая колонка - Изображение/Контент */}
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700">
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center text-white">
              <Sparkles className="w-24 h-24 mx-auto mb-6 opacity-80 animate-pulse" />
              <h3 className="text-3xl font-bold mb-4">
                Почти готово!
              </h3>
              <p className="text-lg opacity-90 mb-8">
                Последние штрихи... Ваш салон будет готов через несколько секунд!
              </p>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Настройка интерфейса</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Создание календаря</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Подготовка данных</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 mr-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  <span>Финальная настройка</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepActivation;