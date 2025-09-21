import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@beauty-platform/ui';
import { Plus, Users, UserPlus, Filter, Search } from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TeamMemberCard } from '../components/team/TeamMemberCard';
export default function TeamPage() {
    const { staff, loading, error, refetch } = useStaff();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const statusOptions = useMemo(() => [
        { value: 'all', label: t('team.filters.allStatuses', 'Все статусы') },
        { value: 'ACTIVE', label: t('common.active', 'Активные') },
        { value: 'INACTIVE', label: t('common.inactive', 'Неактивные') },
    ], [t]);
    const roleOptions = useMemo(() => [
        { value: 'all', label: t('team.filters.allRoles', 'Все роли') },
        { value: 'SALON_OWNER', label: t('team.roles.SALON_OWNER', 'Владелец') },
        { value: 'MANAGER', label: t('team.roles.MANAGER', 'Менеджер') },
        { value: 'STAFF_MEMBER', label: t('team.roles.STAFF_MEMBER', 'Мастер') },
        { value: 'RECEPTIONIST', label: t('team.roles.RECEPTIONIST', 'Администратор') },
        { value: 'ACCOUNTANT', label: t('team.roles.ACCOUNTANT', 'Бухгалтер') },
    ], [t]);
    const filteredStaff = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return staff.filter((member) => {
            const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.toLowerCase();
            const email = member.email?.toLowerCase() ?? '';
            const matchesSearch = !query || fullName.includes(query) || email.includes(query);
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [staff, searchQuery, roleFilter, statusFilter]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 p-6", children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 p-6", children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs(Card, { className: "max-w-md p-8 text-center", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-red-600", children: t('team.error.title', 'Ошибка загрузки') }), _jsx(CardDescription, { children: error })] }), _jsx(CardContent, { children: _jsx(Button, { onClick: () => refetch(), variant: "outline", children: t('team.error.retry', 'Попробовать снова') }) })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-slate-50 p-6", children: _jsxs("div", { className: "mx-auto flex w-full max-w-7xl flex-col gap-8", children: [_jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-semibold text-slate-900", children: t('team.title', 'Команда салона') }), _jsx("p", { className: "text-slate-600 text-sm", children: t('team.subtitle', 'Управляйте составом, ролями и доступами персонала в реальном времени.') })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { variant: "outline", onClick: () => navigate('/team/invite'), className: "border-slate-200", children: [_jsx(UserPlus, { className: "mr-2 h-4 w-4" }), t('team.inviteEmployee', 'Пригласить мастера')] }), _jsxs(Button, { onClick: () => navigate('/team/add'), children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), t('team.addEmployee', 'Добавить сотрудника')] })] })] }), _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [_jsx("div", { className: "w-full lg:flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }), _jsx("input", { type: "text", value: searchQuery, onChange: (event) => setSearchQuery(event.target.value), placeholder: t('team.search', 'Поиск по имени или email'), className: "w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-slate-500" })] }) }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row", children: [_jsxs(Select, { value: roleFilter, onValueChange: setRoleFilter, children: [_jsxs(SelectTrigger, { className: "w-48 bg-white", children: [_jsx(Filter, { className: "mr-2 h-4 w-4 text-slate-400" }), _jsx(SelectValue, { placeholder: t('team.filterByRole', 'Роль') })] }), _jsx(SelectContent, { children: roleOptions.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsxs(SelectTrigger, { className: "w-48 bg-white", children: [_jsx(Filter, { className: "mr-2 h-4 w-4 text-slate-400" }), _jsx(SelectValue, { placeholder: t('team.filterByStatus', 'Статус') })] }), _jsx(SelectContent, { children: statusOptions.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] })] }), _jsx("div", { className: "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3", children: filteredStaff.map((member) => (_jsx(TeamMemberCard, { member: member, t: t, onOpenProfile: () => navigate(`/team/${member.id}`) }, member.id))) }), filteredStaff.length === 0 && (_jsxs(Card, { className: "mx-auto max-w-md border-slate-200 p-12 text-center", children: [_jsxs(CardHeader, { children: [_jsx("div", { className: "mx-auto mb-4 w-fit rounded-full bg-slate-100 p-4", children: _jsx(Users, { className: "h-10 w-10 text-slate-400" }) }), _jsx(CardTitle, { className: "text-xl text-slate-800", children: staff.length === 0
                                        ? t('team.empty.title', 'Команда пока пустая')
                                        : t('team.empty.filteredTitle', 'Ничего не найдено') }), _jsx(CardDescription, { children: staff.length === 0
                                        ? t('team.empty.subtitle', 'Добавьте первых мастеров, чтобы запустить CRM')
                                        : t('team.empty.filterSubtitle', 'Попробуйте изменить критерии поиска') })] }), staff.length === 0 && (_jsx(CardContent, { children: _jsxs(Button, { onClick: () => navigate('/team/add'), children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), t('team.addEmployee', 'Добавить сотрудника')] }) }))] }))] }) }));
}
