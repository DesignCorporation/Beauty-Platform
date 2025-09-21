import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input } from '@beauty-platform/ui'
import { Calendar, Users, Settings, BarChart3, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../currency'

export default function DashboardPage() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}
          </h2>
          <p className="text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="beauty-transition beauty-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('dashboard.stats.appointmentsToday')}
              </CardTitle>
              <div className="text-2xl font-bold text-primary">12</div>
            </CardHeader>
          </Card>
          
          <Card className="beauty-transition beauty-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {t('dashboard.stats.activeClients')}
              </CardTitle>
              <div className="text-2xl font-bold text-success">348</div>
            </CardHeader>
          </Card>

          <Card className="beauty-transition beauty-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                {t('dashboard.stats.monthlyRevenue')}
              </CardTitle>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(12450)}
              </div>
            </CardHeader>
          </Card>

          <Card className="beauty-transition beauty-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.stats.staffOccupancy')}
              </CardTitle>
              <div className="text-2xl font-bold text-amber-600">87%</div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>
                {t('dashboard.quickActionsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="w-4 h-4 mr-3" />
                {t('dashboard.newAppointment')}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-3" />
                {t('dashboard.addClient')}
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="w-4 h-4 mr-3" />
                {t('dashboard.reportsAnalytics')}
              </Button>
            </CardContent>
          </Card>

          {/* Поиск клиентов */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.clientSearch')}</CardTitle>
              <CardDescription>
                {t('dashboard.clientSearchDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                placeholder={t('dashboard.clientSearchPlaceholder')}
                className="w-full"
              />
              <Button className="w-full">
                {t('dashboard.findClient')}
              </Button>
              
              {/* Demo результаты */}
              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{t('dashboard.recentClients')}</h4>
                {['Anna Smith', 'Maria Johnson', 'Elena Brown'].map((name, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded border">
                    <span className="text-sm">{name}</span>
                    <Button size="sm" variant="outline">
                      {t('common.open')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}