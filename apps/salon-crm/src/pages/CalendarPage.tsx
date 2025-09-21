import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, Filter } from 'lucide-react';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { StaffCalendarGrid } from '../components/calendar/StaffCalendarGrid';
import { FiltersModal } from '../components/calendar/FiltersModal';
import { useAppointments } from '../hooks/useAppointments';
import { useStaff } from '../hooks/useStaff';
import { useTenant } from '../contexts/AuthContext';
import type { CalendarView, AppointmentFilters } from '../types/calendar';

// Note: Removed demo appointments - now using only real data from API

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(() => {
    // Start with current date instead of hardcoded demo date
    return new Date(); // Current date - FIXED: was hardcoded to 2025-08-25
  });
  const [filters, setFilters] = useState<AppointmentFilters>({
    staffIds: [],
    statuses: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] // Обновлено под реальные статусы API
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  const { salonId, token } = useTenant();
  const { appointments, loading, error, rescheduleAppointment, refetch } = useAppointments({
    date: currentDate,
    view,
    filters,
    salonId,
    token
  });
  const { staff, loading: staffLoading, error: staffError } = useStaff();

  // FIXED: Use only real appointments from API for ALL calendar views
  const allAppointments = appointments || [];
  
  // Debug log to track data sync issues
  console.log(`[CalendarPage] Loading appointments for ${view} view:`, {
    appointmentsCount: allAppointments.length,
    currentDate: currentDate.toISOString(),
    salonId,
    filters,
    loading,
    error,
    appointments: allAppointments.slice(0, 3) // Show first 3 appointments for debugging
  });

  // Keep calendar on current month - no auto-switching to demo data
  // Users can manually navigate to months with demo data if needed

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
        break;
      default:
        break;
    }
  };


  const getDateTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, d MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        return format(weekStart, 'MMMM yyyy');
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  const roundTimeToQuarterHour = (value: Date) => {
    const rounded = new Date(value);
    const minutes = rounded.getMinutes();
    const remainder = minutes % 15;

    if (remainder !== 0) {
      const increment = 15 - remainder;
      rounded.setMinutes(minutes + increment, 0, 0);
    } else {
      rounded.setSeconds(0, 0);
    }

    return rounded;
  };

  const handleSlotClick = (datetime: Date) => {
    // Navigate to new appointment form with pre-filled date/time
    const roundedDate = roundTimeToQuarterHour(datetime);
    const dateStr = roundedDate.toISOString().split('T')[0];
    const timeStr = roundedDate.toTimeString().slice(0, 5);
    navigate(`/appointments/new?date=${dateStr}&time=${timeStr}`);
  };

  const handleAppointmentClick = (appointmentId: string, mode: string = 'VIEW') => {
    console.log('[CalendarPage] Appointment clicked:', { appointmentId, mode });
    if (mode === 'EDIT') {
      navigate(`/appointments/${appointmentId}/edit`);
    } else {
      navigate(`/appointments/${appointmentId}`);
    }
  };

  const openNewAppointment = () => {
    navigate('/appointments/new');
  };

  // Removed unused function

  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
    
    // Smart date switching logic can be added here if needed
  };

  return (
    <div className="h-full flex flex-col">

      {/* Error Banner - ALWAYS VISIBLE IF ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-1">
              Nie udało się załadować wizyt
            </h3>
            <p className="text-sm text-red-600 mb-3">
              {error}. Kalendarz działa w trybie offline.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      )}

      {/* Navigation - FLAT DESIGN */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">
                {getDateTitle()}
              </h2>
            </div>
            
            <button 
              onClick={() => navigateDate('next')}
              className="px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* View toggle buttons and filters - FLAT STYLE */}
          <div className="flex items-center space-x-3">
            {/* Filter button */}
            <button
              onClick={() => setShowFiltersModal(true)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center space-x-2 ${
                (filters.staffIds.length > 0 || filters.statuses.length < 4)
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtry</span>
              {(filters.staffIds.length > 0 || filters.statuses.length < 4) && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {filters.staffIds.length + (filters.statuses.length < 4 ? 1 : 0)}
                </span>
              )}
            </button>
            
            {/* View toggle buttons */}
            <button 
              onClick={() => handleViewChange('day')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Dzień
            </button>
            <button 
              onClick={() => handleViewChange('week')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tydzień
            </button>
            <button 
              onClick={() => handleViewChange('month')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Miesiąc
            </button>
            <button 
              onClick={() => handleViewChange('staff')}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                view === 'staff' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              По мастерам
            </button>

            {/* New Appointment Button */}
            <button 
              onClick={openNewAppointment}
              className="px-3 py-2 text-sm rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nowa wizyta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - FULL WIDTH */}
      <div className="flex-1 overflow-hidden">
        <div className="calendar-grid h-full">
          {view === 'staff' ? (
            <StaffCalendarGrid
              appointments={allAppointments}
              staff={staff}
              selectedDate={currentDate}
              view="week"
              onAppointmentClick={(appointment) => handleAppointmentClick(appointment.id, 'VIEW')}
              onTimeSlotClick={(staffId, datetime) => {
                // Создание новой записи для конкретного мастера и времени
                navigate('/appointments/new', { 
                  state: { 
                    staffId, 
                    startTime: datetime.toISOString() 
                  } 
                });
              }}
            />
          ) : (
            <CalendarGrid
              view={view}
              currentDate={currentDate}
              appointments={allAppointments}
              onAppointmentClick={(id) => handleAppointmentClick(id, 'VIEW')}
              onSlotClick={handleSlotClick}
              onAppointmentDrop={rescheduleAppointment}
              onDateNavigation={setCurrentDate}
              loading={loading}
              staffFilter={filters.staffIds}
            />
          )}
        </div>
      </div>


      {/* Filters Modal */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        filters={filters}
        onFiltersChange={setFilters}
        salonId={salonId}
        token={token}
      />
    </div>
  );
}
