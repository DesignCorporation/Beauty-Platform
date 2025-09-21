import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@beauty-platform/ui'
import { Sparkles, Eye, EyeOff, Mail, Lock, Zap } from 'lucide-react'
import { clientApi } from '../services'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Используем secure API с CSRF protection
      const response = await clientApi.loginClient({
        email: formData.email,
        password: formData.password
      })

      if (response.success) {
        onLogin()
        navigate('/dashboard')
      } else {
        setError(response.error || 'Ошибка входа')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Ошибка входа. Проверьте данные и попробуйте снова.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoData = () => {
    setFormData({
      email: 'client@example.com',
      password: 'client123'
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Beauty Platform</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Войти в аккаунт</h2>
          <p className="mt-2 text-gray-600">
            Или{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
              создайте новый аккаунт
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Вход для клиентов</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email адрес
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Запомнить меня
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Забыли пароль?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>

            {/* Demo credentials with autofill button */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-900">Демо данные для тестирования:</p>
                <Button
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={fillDemoData}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Заполнить
                </Button>
              </div>
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> client@example.com<br />
                <strong>Пароль:</strong> client123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}