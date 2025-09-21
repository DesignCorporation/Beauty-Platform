import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui';
import { Lightbulb, Plus, CheckCircle, Clock, Users, Zap, Code, Palette, Shield } from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  category: 'ux' | 'performance' | 'security' | 'feature' | 'architecture';
  priority: 'high' | 'medium' | 'low';
  status: 'idea' | 'planned' | 'in-progress' | 'completed';
  estimatedHours?: number;
  author: string;
  createdAt: string;
  comments?: string[];
}

export const IdeasSection: React.FC = () => {
  const [expandedIdeas, setExpandedIdeas] = useState<Set<string>>(new Set());

  const toggleIdea = (ideaId: string) => {
    const newExpanded = new Set(expandedIdeas);
    if (newExpanded.has(ideaId)) {
      newExpanded.delete(ideaId);
    } else {
      newExpanded.add(ideaId);
    }
    setExpandedIdeas(newExpanded);
  };

  const ideas: Idea[] = [
    {
      id: 'salon-crm-completed',
      title: '✅ SALON CRM - ПОЛНОСТЬЮ ГОТОВ!',
      description: 'Успешно мигрирован календарь из старого проекта в новую архитектуру. 7 полных разделов с современным UI.',
      category: 'feature',
      priority: 'high',
      status: 'completed',
      estimatedHours: 16,
      author: 'frontend-dev agent',
      createdAt: '2025-08-15',
      comments: [
        '🎯 URL: https://test-crm.beauty.designcorp.eu/',
        '📊 7 разделов: Dashboard, Календарь, Услуги, Клиенты, Команда, Платежи, Аналитика',
        '📅 Календарь: месячный вид, demo записи, цветовое кодирование статусов',
        '🎨 Shadcn/UI: коллапсируемое меню, современный дизайн',
        '🔄 Миграция: взят лучший код из /root/beauty/apps/web-crm/',
        '📱 Responsive: адаптивный дизайн для всех устройств',
        'ТРЕБУЕТСЯ: локализация, убрать модалки, исправить валюту на EUR'
      ]
    },
    {
      id: 'crm-localization',
      title: '🌍 CRM локализация',
      description: 'Добавить многоязычность в Salon CRM как в админке: EN, PL, UA (без ru)',
      category: 'feature',
      priority: 'high',
      status: 'planned',
      estimatedHours: 6,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'Использовать react-i18next как в админке',
        'Языки: EN (английский), PL (польский), UA (украинский)',
        'Переводы для всех 7 разделов CRM',
        'Календарь с локализованными названиями месяцев/дней'
      ]
    },
    {
      id: 'no-modals-policy',
      title: '🔗 Политика: НЕТ модальных окон!',
      description: 'ВСЕ интерфейсы работают по ссылкам. Никаких popup/modal окон. Только навигация по URL.',
      category: 'ux',
      priority: 'high',
      status: 'planned',
      estimatedHours: 8,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'Редактирование клиента: /clients/123/edit',
        'Новая запись: /calendar/new-appointment',
        'Просмотр записи: /appointments/456',
        'Настройки услуги: /services/789/settings',
        'Каждое действие = отдельная страница с уникальным URL',
        'Возможность шарить прямые ссылки на любой элемент'
      ]
    },
    {
      id: 'multi-currency-system',
      title: '💱 Мультивалютная система',
      description: 'Система переключения валют по странам: PLN (Польша старт), EUR, USD, UAH. Админ может менять валюту салона.',
      category: 'feature',
      priority: 'high',
      status: 'planned',
      estimatedHours: 8,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'СТАРТ: PLN (злотые) - Польша наш первый рынок',
        'Поддержка: EUR (евро), USD (доллар), UAH (гривна)',
        'Переключатель валют в настройках салона',
        'Форматирование по локали: 25,00 zł, €25.00, $25, 25 ₴',
        'Сейчас везде EUR - временно, переделать на PLN',
        'БЕЗ RUB! Российские рубли исключены'
      ]
    },
    {
      id: 'multi-step-registration',
      title: '🔐 Многоступенчатая регистрация салонов',
      description: 'Красивая пошаговая регистрация салона с валидацией, email подтверждением и настройкой базовых параметров.',
      category: 'feature',
      priority: 'high',
      status: 'planned',
      estimatedHours: 12,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'ШАГ 1: Основная информация (название, страна, город)',
        'ШАГ 2: Контактные данные (email, телефон, адрес)',
        'ШАГ 3: Настройки (валюта, язык, часовой пояс)',
        'ШАГ 4: Email подтверждение + SMS опционально',
        'ШАГ 5: Создание первого админа салона',
        'Красивый прогресс-бар, валидация на каждом шаге',
        'Интеграция с Auth Service (JWT)',
        'Автоматическое создание tenant в БД'
      ]
    },
    {
      id: 'live-sync',
      title: '🔄 Live синхронизация MCP с админкой',
      description: 'Интерактивная документация с мгновенным обновлением MCP по принципу Vite HMR. Убрать 5-минутные интервалы.',
      category: 'performance',
      priority: 'high',
      status: 'idea',
      estimatedHours: 8,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'Использовать WebSocket соединение между админкой и MCP',
        'При изменении документации -> мгновенный push в MCP',
        'Аналогично Vite HMR - изменил файл, сразу обновилось'
      ]
    },
    {
      id: 'interactive-checklist',
      title: '✅ Интерактивный редактор чек-листа',
      description: 'Возможность ставить галочки, добавлять комментарии, менять статусы задач прямо в админке. AI видит изменения в реальном времени.',
      category: 'ux',
      priority: 'high',
      status: 'idea',
      estimatedHours: 12,
      author: 'User', 
      createdAt: '2025-08-15',
      comments: [
        'Редактирование статуса задач прямо в UI',
        'Добавление комментариев и заметок к задачам',
        'История изменений логики/требований',
        'AI видит что готово, что нужно доделать, что изменилось'
      ]
    },
    {
      id: 'role-logic-system',
      title: '👥 Система логики ролей и работы сайта',
      description: 'Полная документация логики работы всех ролей пользователей и бизнес-процессов платформы.',
      category: 'architecture',
      priority: 'high',
      status: 'planned',
      estimatedHours: 20,
      author: 'User',
      createdAt: '2025-08-15',
      comments: [
        'Логика работы каждой роли: SUPER_ADMIN, SALON_OWNER, MANAGER, STAFF_MEMBER, RECEPTIONIST, ACCOUNTANT, CLIENT',
        'Бизнес-процессы: регистрация, запись клиентов, управление салоном',
        'Интеграция с существующей системой ролей',
        'Документирование всех workflow'
      ]
    }
  ];

  const getCategoryIcon = (category: Idea['category']) => {
    switch (category) {
      case 'ux': return <Palette className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'feature': return <Plus className="w-4 h-4" />;
      case 'architecture': return <Code className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: Idea['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'planned': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Lightbulb className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryColor = (category: Idea['category']) => {
    switch (category) {
      case 'ux': return 'border-purple-200 bg-purple-50';
      case 'performance': return 'border-yellow-200 bg-yellow-50';
      case 'security': return 'border-red-200 bg-red-50';
      case 'feature': return 'border-green-200 bg-green-50';
      case 'architecture': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: Idea['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 font-semibold';
      case 'medium': return 'text-orange-600 font-medium';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const groupedIdeas = ideas.reduce((acc, idea) => {
    if (!acc[idea.category]) acc[idea.category] = [];
    acc[idea.category].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
            💡 Ideas & Future Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Коллекция идей для улучшения Beauty Platform. Эти функции помогут сделать платформу еще более удобной и эффективной.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{ideas.length}</div>
              <div className="text-sm text-gray-600">Всего идей</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {ideas.filter(i => i.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-600">Высокий приоритет</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {ideas.filter(i => i.status === 'planned').length}
              </div>
              <div className="text-sm text-gray-600">Запланировано</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {ideas.reduce((sum, idea) => sum + (idea.estimatedHours || 0), 0)}h
              </div>
              <div className="text-sm text-gray-600">Оценка времени</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Идеи по категориям */}
      {Object.entries(groupedIdeas).map(([category, categoryIdeas]) => (
        <Card key={category} className={`${getCategoryColor(category as Idea['category'])} border-2`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getCategoryIcon(category as Idea['category'])}
              {category.toUpperCase()} ({categoryIdeas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryIdeas.map((idea) => (
              <Card key={idea.id} className="bg-white border border-gray-200">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleIdea(idea.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(idea.status)}
                      <div>
                        <h4 className="font-semibold text-gray-900">{idea.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className={getPriorityColor(idea.priority)}>
                            {idea.priority.toUpperCase()}
                          </span>
                          {idea.estimatedHours && (
                            <span>~{idea.estimatedHours}h</span>
                          )}
                          <span>by {idea.author}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {expandedIdeas.has(idea.id) ? '▼' : '▶'}
                    </span>
                  </div>
                </CardHeader>
                
                {expandedIdeas.has(idea.id) && (
                  <CardContent className="pt-0">
                    <p className="text-gray-700 mb-4">{idea.description}</p>
                    
                    {idea.comments && idea.comments.length > 0 && (
                      <div className="border-t pt-4">
                        <h5 className="font-medium text-gray-900 mb-2">Детали и комментарии:</h5>
                        <ul className="space-y-2">
                          {idea.comments.map((comment, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-indigo-500 mt-1">•</span>
                              {comment}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                      <span>Создано: {idea.createdAt}</span>
                      <span>Статус: {idea.status}</span>
                      <span>Категория: {idea.category}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Урок от пользователя */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Users className="w-6 h-6" />
            📝 Важный урок от пользователя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Сначала думать логически</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Потом действовать</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Работаем ТАМ где находимся</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Не усложнять простые вещи</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};