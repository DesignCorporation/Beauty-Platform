import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@beauty-platform/ui'
import { Plus, Users, UserPlus, Filter, Search } from 'lucide-react'
import { useStaff } from '../hooks/useStaff'
import { useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TeamMemberCard } from '../components/team/TeamMemberCard'

export default function TeamPage() {
  const { staff, loading, error, refetch } = useStaff()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('team.filters.allStatuses', 'Все статусы') },
      { value: 'ACTIVE', label: t('common.active', 'Активные') },
      { value: 'INACTIVE', label: t('common.inactive', 'Неактивные') },
    ],
    [t],
  )

  const roleOptions = useMemo(
    () => [
      { value: 'all', label: t('team.filters.allRoles', 'Все роли') },
      { value: 'SALON_OWNER', label: t('team.roles.SALON_OWNER', 'Владелец') },
      { value: 'MANAGER', label: t('team.roles.MANAGER', 'Менеджер') },
      { value: 'STAFF_MEMBER', label: t('team.roles.STAFF_MEMBER', 'Мастер') },
      { value: 'RECEPTIONIST', label: t('team.roles.RECEPTIONIST', 'Администратор') },
      { value: 'ACCOUNTANT', label: t('team.roles.ACCOUNTANT', 'Бухгалтер') },
    ],
    [t],
  )

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return staff.filter((member) => {
      const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.toLowerCase()
      const email = member.email?.toLowerCase() ?? ''
      const matchesSearch = !query || fullName.includes(query) || email.includes(query)
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [staff, searchQuery, roleFilter, statusFilter])


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="flex items-center justify-center h-64">
          <Card className="max-w-md p-8 text-center">
            <CardHeader>
              <CardTitle className="text-red-600">{t('team.error.title', 'Ошибка загрузки')}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => refetch()} variant="outline">
                {t('team.error.retry', 'Попробовать снова')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              {t('team.title', 'Команда салона')}
            </h1>
            <p className="text-slate-600 text-sm">
              {t(
                'team.subtitle',
                'Управляйте составом, ролями и доступами персонала в реальном времени.'
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/team/invite')} className="border-slate-200">
              <UserPlus className="mr-2 h-4 w-4" />
              {t('team.inviteEmployee', 'Пригласить мастера')}
            </Button>
            <Button onClick={() => navigate('/team/add')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('team.addEmployee', 'Добавить сотрудника')}
            </Button>
          </div>
        </div>


        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:flex-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('team.search', 'Поиск по имени или email')}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48 bg-white">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder={t('team.filterByRole', 'Роль')} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-white">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder={t('team.filterByStatus', 'Статус')} />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStaff.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              t={t}
              onOpenProfile={() => navigate(`/team/${member.id}`)}
            />
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card className="mx-auto max-w-md border-slate-200 p-12 text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-fit rounded-full bg-slate-100 p-4">
                <Users className="h-10 w-10 text-slate-400" />
              </div>
              <CardTitle className="text-xl text-slate-800">
                {staff.length === 0
                  ? t('team.empty.title', 'Команда пока пустая')
                  : t('team.empty.filteredTitle', 'Ничего не найдено')}
              </CardTitle>
              <CardDescription>
                {staff.length === 0
                  ? t('team.empty.subtitle', 'Добавьте первых мастеров, чтобы запустить CRM')
                  : t('team.empty.filterSubtitle', 'Попробуйте изменить критерии поиска')}
              </CardDescription>
            </CardHeader>
            {staff.length === 0 && (
              <CardContent>
                <Button onClick={() => navigate('/team/add')}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('team.addEmployee', 'Добавить сотрудника')}
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
