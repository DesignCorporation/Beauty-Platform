import { Card, CardContent, CardHeader, CardTitle, Badge, Button, withOpacity } from '@beauty-platform/ui'
import { Mail, Phone, Crown, Shield, Scissors, Users, ArrowRight, Languages, Calendar } from 'lucide-react'
import type { StaffMember } from '../../hooks/useStaff'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'

const roleIcons: Record<string, any> = {
  SALON_OWNER: Crown,
  MANAGER: Shield,
  STAFF_MEMBER: Scissors,
  RECEPTIONIST: Users,
  ACCOUNTANT: Users,
}

const languageFlags: Record<string, string> = {
  pl: '🇵🇱',
  en: '🇬🇧',
  ru: '🇷🇺',
  ua: '🇺🇦',
}

interface TeamMemberCardProps {
  member: StaffMember
  onOpenProfile: () => void
  t: TFunction
}

export function TeamMemberCard({ member, onOpenProfile, t }: TeamMemberCardProps) {
  const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim()
  const initials = useMemo(() => {
    const first = member.firstName?.charAt(0) ?? ''
    const last = member.lastName?.charAt(0) ?? (member.firstName?.charAt(1) ?? '')
    return `${first}${last}`.toUpperCase() || '??'
  }, [member.firstName, member.lastName])

  const accentColor = member.color || '#6E6BC1'
  const accentSoft = withOpacity(accentColor, 0.12)
  const accentBorder = withOpacity(accentColor, 0.35)
  const accentShadow = withOpacity(accentColor, 0.2)
  const RoleIcon = roleIcons[member.role] ?? Shield

  const joinDate = member.createdAt ? new Date(member.createdAt) : null
  const tenureMonths = joinDate ? Math.max(0, Math.round((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30))) : null
  const tenureLabel = tenureMonths !== null
    ? tenureMonths >= 12
      ? t('team.card.tenureYears', { defaultValue: '{{count}} лет', count: Math.floor(tenureMonths / 12) })
      : t('team.card.tenureMonths', { defaultValue: '{{count}} мес', count: tenureMonths })
    : t('team.card.recently', { defaultValue: 'Недавно присоединился' })

  const spokenLanguages = member.permissions?.filter((perm) => perm.startsWith('lang:')).map((perm) => perm.replace('lang:', '')) ?? []
  const displayLanguages = spokenLanguages.length ? spokenLanguages : ['pl']


  return (
    <Card
      className="group transition-all duration-200 border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer"
      style={{ boxShadow: `0 8px 24px ${accentShadow}` }}
      data-accent={accentColor}
      onClick={onOpenProfile}
    >
      <CardHeader className="pb-0">
        <div
          className="h-1.5 w-full rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-xl font-semibold text-white shadow-md"
              style={{
                backgroundColor: accentColor,
                border: `4px solid ${accentBorder}`,
              }}
            >
              {initials}
            </div>
            {member.isActive && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-emerald-400" />
            )}
          </div>

          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              {fullName || t('team.card.unknownName', { defaultValue: 'Новый сотрудник' })}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Badge variant="outline" style={{ backgroundColor: accentSoft, borderColor: accentBorder, color: accentColor }}>
                <RoleIcon className="mr-1 h-3 w-3" />
                {t(`team.roles.${member.role}`, { defaultValue: member.role })}
              </Badge>
              <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {member.status === 'ACTIVE'
                  ? t('common.active', { defaultValue: 'Активен' })
                  : t('common.inactive', { defaultValue: 'Неактивен' })}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-600">
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3" style={{ border: `1px solid ${accentSoft}` }}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{t('team.card.joined', { defaultValue: 'В команде с' })}</span>
            </div>
            <span className="font-medium text-slate-800">{joinDate ? joinDate.toLocaleDateString() : t('team.card.recentlyShort', { defaultValue: 'Недавно' })}</span>
          </div>


          <div className="flex items-center justify-between text-slate-500 px-1">
            <span>{t('team.card.tenureLabel', { defaultValue: 'Стаж в CRM' })}</span>
            <span className="font-medium text-slate-700">{tenureLabel}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {member.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{member.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="truncate">{member.email}</span>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400 mb-2">
            <span>{t('team.card.languages', { defaultValue: 'Языки' })}</span>
            <Languages className="h-3 w-3" />
          </div>
          <div className="flex flex-wrap gap-2">
            {displayLanguages.map((lang) => (
              <Badge key={lang} variant="outline" className="px-2 py-1 text-xs" style={{ borderColor: accentBorder }}>
                {languageFlags[lang] || '🌐'} {lang.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" className="text-slate-600 hover:text-slate-900" onClick={onOpenProfile}>
            {t('team.card.openProfile', { defaultValue: 'Открыть профиль' })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default TeamMemberCard
