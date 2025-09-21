import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@beauty-platform/ui'
import { ArrowLeft, Edit3, Save, X, Mail, Phone, Shield, DollarSign, Award, Calendar, Sparkles } from 'lucide-react'
import { useStaff } from '../hooks/useStaff'
import { useToast } from '../contexts/ToastContext'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../currency'

const STAFF_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Coral', value: '#fb7185' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Teal', value: '#06b6d4' },
  { label: 'Slate', value: '#64748b' },
]

const LANGUAGE_OPTIONS = [
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
]

const DEFAULT_SCHEDULE = [
  { day: 'Понедельник', start: '09:00', end: '18:00', isWorking: true },
  { day: 'Вторник', start: '09:00', end: '18:00', isWorking: true },
  { day: 'Среда', start: '09:00', end: '18:00', isWorking: true },
  { day: 'Четверг', start: '09:00', end: '18:00', isWorking: true },
  { day: 'Пятница', start: '09:00', end: '17:00', isWorking: true },
  { day: 'Суббота', start: '10:00', end: '15:00', isWorking: true },
  { day: 'Воскресенье', start: '-', end: '-', isWorking: false },
]

export default function StaffProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { staff } = useStaff()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const { formatPrice, supportedCurrencies, currency, changeCurrency } = useCurrency()

  const staffMember = useMemo(() => staff.find((item) => item.id === id) ?? null, [staff, id])

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'settings'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    color: '#6366f1',
    spokenLanguages: ['pl'],
    canSeeFinances: false,
    bio: '',
    specialties: 'Стрижки, окрашивание, уход',
    notes: '',
  })

  useEffect(() => {
    if (!staffMember) return
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      email: staffMember.email,
      phone: staffMember.phone || '',
      color: staffMember.color || '#6366f1',
      spokenLanguages: staffMember.permissions?.filter((perm) => perm.startsWith('lang:')).map((perm) => perm.replace('lang:', '')) || ['pl'],
      canSeeFinances: staffMember.canSeeFinances ?? false,
      bio: '',
      specialties: 'Стрижки, окрашивание, уход',
      notes: '',
    })
  }, [staffMember])

  if (!staffMember) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex max-w-4xl items-center justify-center rounded-2xl bg-white p-12 shadow-sm">
          <div className="space-y-3 text-center">
            <div className="text-lg font-medium text-slate-900">{t('team.profile.notFoundTitle', 'Мастер не найден')}</div>
            <p className="text-slate-500">{t('team.profile.notFoundSubtitle', 'Выберите мастера на странице команды')}</p>
            <Button onClick={() => navigate('/team')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('team.profile.backToTeam', 'Вернуться к списку')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const fullName = `${staffMember.firstName} ${staffMember.lastName}`.trim()
  const initials = `${staffMember.firstName?.charAt(0) ?? ''}${staffMember.lastName?.charAt(0) ?? ''}`.toUpperCase() || '??'
  const accentColor = formData.color
  const createdAt = staffMember.createdAt ? new Date(staffMember.createdAt) : null
  const tenure = createdAt ? Math.max(0, Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : null

  const handleLanguageToggle = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      spokenLanguages: prev.spokenLanguages.includes(code)
        ? prev.spokenLanguages.filter((lang) => lang !== code)
        : [...prev.spokenLanguages, code],
    }))
  }

  const handleSave = () => {
    showToast({
      title: t('team.profile.savedTitle', 'Профиль обновлен'),
      description: t('team.profile.savedDescription', 'Изменения сохранятся после подключения API'),
      variant: 'success',
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (staffMember) {
      setIsEditing(false)
      setFormData({
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
        phone: staffMember.phone || '',
        color: staffMember.color || '#6366f1',
        spokenLanguages: staffMember.permissions?.filter((perm) => perm.startsWith('lang:')).map((perm) => perm.replace('lang:', '')) || ['pl'],
        canSeeFinances: staffMember.canSeeFinances ?? false,
        bio: '',
        specialties: 'Стрижки, окрашивание, уход',
        notes: '',
      })
    }
  }

  const metrics = {
    avgTicket: formatPrice(65 + (staffMember.priority ?? 1) * 12, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    monthlyRevenue: formatPrice(5200 + (staffMember.priority ?? 1) * 320, { maximumFractionDigits: 0 }),
    satisfaction: `${88 + Math.min(10, (staffMember.priority ?? 1) * 2)}%`,
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('team.profile.back', 'Назад к команде')}
          </Button>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                {t('team.profile.edit', 'Редактировать')}
              </Button>
            )}
            {isEditing && (
              <>
                <Button variant="ghost" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  {t('team.profile.cancel', 'Отмена')}
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('team.profile.save', 'Сохранить')}
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="border-slate-200">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
            <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full text-3xl font-semibold text-white shadow" style={{ backgroundColor: accentColor }}>
              {initials}
              {staffMember.isActive && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-2xl text-slate-900">{fullName}</CardTitle>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {t(`team.roles.${staffMember.role}`, staffMember.role)}
                  </Badge>
                  <Badge variant={staffMember.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {staffMember.status === 'ACTIVE' ? t('common.active', 'Активен') : t('common.inactive', 'Неактивен')}
                  </Badge>
                </div>
                <CardDescription className="mt-1 text-slate-500">
                  {t('team.profile.subtitle', 'Профиль мастера и персональные настройки сервиса')}
                </CardDescription>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {t('team.profile.avgTicket', 'Средний чек')}
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{metrics.avgTicket}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {t('team.profile.monthlyRevenue', 'Месячный оборот')}
                  </div>
                  <div className="text-lg font-semibold text-slate-900">{metrics.monthlyRevenue}</div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {t('team.profile.satisfaction', 'Лояльность клиентов')}
                  </div>
                  <div className="text-lg font-semibold text-emerald-600">{metrics.satisfaction}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{staffMember.email}</span>
                </div>
                {staffMember.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{staffMember.phone}</span>
                  </div>
                )}
                {createdAt && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>
                      {t('team.profile.joined', 'В команде с')} {createdAt.toLocaleDateString()}
                    </span>
                  </div>
                )}
                {tenure !== null && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span>
                      {tenure >= 12
                        ? t('team.profile.tenureYears', { defaultValue: '{{count}} лет', count: Math.floor(tenure / 12) })
                        : t('team.profile.tenureMonths', { defaultValue: '{{count}} мес', count: tenure })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-white">
            <TabsTrigger value="overview">{t('team.profile.overviewTab', 'Обзор')}</TabsTrigger>
            <TabsTrigger value="schedule">{t('team.profile.scheduleTab', 'Расписание')}</TabsTrigger>
            <TabsTrigger value="settings">{t('team.profile.settingsTab', 'Настройки')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-slate-200 lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t('team.profile.specialties', 'Экспертиза и услуги')}</CardTitle>
                  <CardDescription>
                    {t('team.profile.specialtiesHint', 'Задайте ключевые направления работы мастера и связанные услуги')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    {formData.specialties.split(',').map((item) => (
                      <Badge key={item} variant="outline" className="border-slate-200 text-slate-600">
                        <Sparkles className="mr-1 h-3 w-3" />
                        {item.trim()}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    value={formData.bio}
                    onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                    placeholder={t('team.profile.bioPlaceholder', 'Расскажите кратко о стиле работы мастера, сертификатах и любимых услугах')}
                    className="min-h-[120px]"
                    disabled={!isEditing}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>{t('team.profile.languagesTitle', 'Языки общения')}</CardTitle>
                  <CardDescription>{t('team.profile.languagesSubtitle', 'Выберите языки, на которых мастер принимает клиентов')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <label key={language.code} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-lg">{language.flag}</span>
                        {language.name}
                      </span>
                      <Switch
                        checked={formData.spokenLanguages.includes(language.code)}
                        onCheckedChange={() => handleLanguageToggle(language.code)}
                        disabled={!isEditing}
                      />
                    </label>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>{t('team.profile.accessTitle', 'Права и доступ')}</CardTitle>
                <CardDescription>{t('team.profile.accessSubtitle', 'Контролируйте доступ к финансовым данным и административным функциям')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-slate-400" />
                    {t('team.profile.permissions.finances', 'Доступ к финансовым показателям')}
                  </span>
                  <Switch
                    checked={formData.canSeeFinances}
                    onCheckedChange={(value) => setFormData((prev) => ({ ...prev, canSeeFinances: value }))}
                    disabled={!isEditing}
                  />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-sm text-slate-600">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    {t('team.profile.permissions.pricing', 'Право изменять цены услуг')}
                  </span>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {t('team.profile.permissions.availableSoon', 'Скоро')}
                  </Badge>
                </label>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6 space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>{t('team.profile.scheduleTitle', 'Рабочие часы')}</CardTitle>
                <CardDescription>
                  {t('team.profile.scheduleSubtitle', 'Гибко управляйте расписанием и доступностью мастера в календаре CRM')}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                <div className="grid gap-2">
                  {DEFAULT_SCHEDULE.map((item) => (
                    <div key={item.day} className="grid grid-cols-2 items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">{item.day}</span>
                      {item.isWorking ? (
                        <span className="justify-self-end text-slate-800">
                          {item.start} — {item.end}
                        </span>
                      ) : (
                        <span className="justify-self-end text-slate-400">{t('team.profile.dayOff', 'Выходной')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>{t('team.profile.notesTitle', 'Заметки для команды')}</CardTitle>
                <CardDescription>{t('team.profile.notesSubtitle', 'Поделитесь рекомендациями по работе с мастером')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder={t('team.profile.notesPlaceholder', 'Например: предпочитает встречи до 16:00, ведет VIP-клиентов, обучает новых мастеров')}
                  className="min-h-[120px]"
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6 space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>{t('team.profile.appearanceTitle', 'Стиль и цвета')}</CardTitle>
                <CardDescription>{t('team.profile.appearanceSubtitle', 'Настройте цветовую схему карточек мастера в CRM')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>{t('team.profile.colorLabel', 'Акцентный цвет')}</Label>
                <div className="flex flex-wrap gap-2">
                  {STAFF_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-10 w-10 rounded-full border-2 ${formData.color === color.value ? 'border-slate-900' : 'border-transparent'}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => isEditing && setFormData((prev) => ({ ...prev, color: color.value }))}
                      aria-label={color.label}
                    />
                  ))}
                </div>
                <Input
                  value={formData.color}
                  onChange={(event) => setFormData((prev) => ({ ...prev, color: event.target.value }))}
                  disabled={!isEditing}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>{t('team.profile.currencyTitle', 'Валюта показателей')}</CardTitle>
                <CardDescription>{t('team.profile.currencySubtitle', 'Отображение KPI мастера в удобной валюте')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Select value={currency} onValueChange={(value) => changeCurrency(value as any)}>
                  <SelectTrigger className="w-full bg-white sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedCurrencies.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.flag} {item.code} — {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-500">
                  {t('team.profile.currencyHint', 'Эта настройка влияет на блоки аналитики и дашборды')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
