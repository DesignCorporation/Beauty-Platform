import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@beauty-platform/ui'
import { Calendar, Sparkles, Users, Star } from 'lucide-react'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Beauty Platform</h1>
            </div>
            <div className="flex space-x-4">
              <Link to="/login">
                <Button variant="outline">Войти</Button>
              </Link>
              <Link to="/register">
                <Button>Регистрация</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Запишитесь в любимый салон красоты
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Находите лучшие салоны красоты, записывайтесь онлайн и получайте качественные услуги от профессиональных мастеров
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Начать запись
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Почему выбирают нас
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Онлайн запись</h4>
              <p className="text-gray-600">
                Записывайтесь к мастеру в удобное время без звонков и ожидания
              </p>
            </div>
            <div className="text-center">
              <Users className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Лучшие мастера</h4>
              <p className="text-gray-600">
                Работаем только с проверенными салонами и квалифицированными специалистами
              </p>
            </div>
            <div className="text-center">
              <Star className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Отзывы клиентов</h4>
              <p className="text-gray-600">
                Читайте реальные отзывы и выбирайте мастера по рейтингу
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold mb-6 text-gray-900">
            Готовы записаться на процедуру?
          </h3>
          <p className="text-xl mb-8 text-gray-600">
            Создайте аккаунт и найдите идеальный салон красоты рядом с вами
          </p>
          <Link to="/register">
            <Button size="lg" className="text-lg px-8 py-3">
              Зарегистрироваться сейчас
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-6 w-6" />
            <span className="text-lg font-semibold">Beauty Platform</span>
          </div>
          <p className="text-gray-400">
            © 2025 Beauty Platform. Ваш путь к красоте начинается здесь.
          </p>
        </div>
      </footer>
    </div>
  )
}