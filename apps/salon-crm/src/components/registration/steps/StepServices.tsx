import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@beauty-platform/ui';
import { Scissors, Sparkles, Eye, Waves, Palette, Zap, Syringe, Heart, Users, User, Building2, Factory, CheckCircle } from 'lucide-react';
import { RegistrationData } from '../MultiStepRegistration';

interface StepServicesProps {
  data: RegistrationData;
  updateData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const StepServices: React.FC<StepServicesProps> = ({ data, updateData, onNext, onPrevious }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{serviceCategories?: string}>({});

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

  const validateForm = (): boolean => {
    const newErrors: {serviceCategories?: string} = {};

    if (data.serviceCategories.length === 0) {
      newErrors.serviceCategories = t('registration.validation.serviceCategoriesRequired', 'Выберите хотя бы одну категорию услуг');
    } else if (data.serviceCategories.length > 5) {
      newErrors.serviceCategories = t('registration.validation.serviceCategoriesMax', 'Выберите не более 5 категорий');
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
      await new Promise(resolve => setTimeout(resolve, 800));
      onNext();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleServiceCategory = (categoryId: string) => {
    const currentCategories = data.serviceCategories;
    const isSelected = currentCategories.includes(categoryId);
    
    let newCategories;
    if (isSelected) {
      newCategories = currentCategories.filter(id => id !== categoryId);
    } else {
      if (currentCategories.length < 5) {
        newCategories = [...currentCategories, categoryId];
      } else {
        return; // Максимум 5 категорий
      }
    }
    
    updateData({ serviceCategories: newCategories });
    
    // Очищаем ошибку при изменении
    if (errors.serviceCategories) {
      setErrors(prev => ({ ...prev, serviceCategories: undefined }));
    }
  };

  const handleTeamSizeChange = (teamSize: 'solo' | 'small' | 'medium' | 'large') => {
    updateData({ teamSize });
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
              {t('registration.services.title', 'Какие услуги вы предоставляете?')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('registration.services.subtitle', 'Выберите до 5 основных направлений вашего бизнеса')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Популярные категории */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('registration.services.popular', 'Популярные услуги')}
                </h3>
                <div className="text-sm text-gray-600">
                  {data.serviceCategories.length}/5
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {serviceCategories.filter(cat => cat.popular).map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = data.serviceCategories.includes(category.id);
                  const isDisabled = !isSelected && data.serviceCategories.length >= 5;
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => !isDisabled && toggleServiceCategory(category.id)}
                      disabled={isDisabled}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-gray-100' : 'bg-gray-100'
                        }`}>
                          <IconComponent className={`w-5 h-5 ${
                            isSelected ? 'text-gray-900' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`font-medium ${
                            isSelected ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {category.title}
                          </h3>
                          <p className={`text-sm ${
                            isSelected ? 'text-gray-600' : 'text-gray-600'
                          }`}>
                            {category.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Остальные категории */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t('registration.services.other', 'Другие направления')}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {serviceCategories.filter(cat => !cat.popular).map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = data.serviceCategories.includes(category.id);
                  const isDisabled = !isSelected && data.serviceCategories.length >= 5;
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => !isDisabled && toggleServiceCategory(category.id)}
                      disabled={isDisabled}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-4 h-4 ${
                          isSelected ? 'text-gray-900' : 'text-gray-600'
                        }`} />
                        <h3 className={`font-medium text-sm ${
                          isSelected ? 'text-gray-900' : 'text-gray-900'
                        }`}>
                          {category.title}
                        </h3>
                        {isSelected && (
                          <div className="w-3 h-3 bg-gray-900 rounded-full flex items-center justify-center ml-auto">
                            <div className="w-1 h-1 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {errors.serviceCategories && (
              <p className="text-sm text-red-500">{errors.serviceCategories}</p>
            )}

            {/* Размер команды */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t('registration.services.teamSizeTitle', 'Размер вашей команды')}
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {teamSizes.map((team) => {
                  const IconComponent = team.icon;
                  const isSelected = data.teamSize === team.id;
                  
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleTeamSizeChange(team.id as any)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <IconComponent className={`w-5 h-5 ${
                            isSelected ? 'text-gray-900' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {team.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {team.description}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Кнопки навигации */}
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
                disabled={isLoading || data.serviceCategories.length === 0}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t('registration.saving', 'Сохраняем...')}
                  </div>
                ) : (
                  t('registration.continue', 'Продолжить')
                )}
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
              <Scissors className="w-24 h-24 mx-auto mb-6 opacity-80" />
              <h3 className="text-3xl font-bold mb-4">
                Выберите ваши услуги
              </h3>
              <p className="text-lg opacity-90 mb-8">
                Система настроится под ваш бизнес и поможет эффективно управлять салоном
              </p>
              <div className="space-y-3 text-left max-w-sm mx-auto">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Автоматическое создание услуг</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Персонализированный интерфейс</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Аналитика по категориям</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  <span>Готовые шаблоны расписания</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepServices;