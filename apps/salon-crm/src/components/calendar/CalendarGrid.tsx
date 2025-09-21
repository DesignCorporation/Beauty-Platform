import React, { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addMinutes, differenceInMinutes, isSameMonth } from 'date-fns';
import { pl } from 'date-fns/locale';
import { AppointmentBlock } from './AppointmentBlock';
import { CurrentTimeLine } from './CurrentTimeLine';
import type { CalendarAppointment, CalendarView } from '../../types/calendar';
import { useWorkingHours, isWithinWorkingHours, isWithinWorkingHoursSlot, getWorkingHoursRange, getOverallWorkingHoursRange } from '../../hooks/useWorkingHours';
import { useStaffSchedules, isStaffAvailable } from '../../hooks/useStaffSchedules';

interface CalendarGridProps {
  view: CalendarView;
  currentDate: Date;
  appointments: CalendarAppointment[];
  onAppointmentClick: (appointmentId: string) => void;
  onSlotClick: (datetime: Date) => void;
  onAppointmentDrop: (appointmentId: string, newStartAt: string, newStaffId?: string) => void;
  onDateNavigation?: (date: Date) => void;
  loading: boolean;
  staffFilter?: string[]; // Optional staff filter for availability checking
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  view,
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
  onDateNavigation,
  loading,
  staffFilter = []
}) => {
  // Load working hours from API
  const { workingHours, loading: workingHoursLoading } = useWorkingHours();
  const { schedules: staffSchedules } = useStaffSchedules();
  
  // Calculate dynamic working hours range
  const workingHoursRange = useMemo(() => {
    if (workingHours.length === 0) {
      return { start: 7, end: 20, interval: 30 }; // Fallback to default
    }
    const { earliestHour, latestHour } = getOverallWorkingHoursRange(workingHours);
    return { start: earliestHour, end: latestHour, interval: 30 };
  }, [workingHours]);
  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else if (view === 'month') {
      // Month view - always show exactly 6 weeks (42 days) for consistent layout
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Start from Monday of the first week
      const start = startOfWeek(startOfMonth, { weekStartsOn: 1 });
      
      // Always show 6 weeks (42 days) for consistent calendar height
      const end = new Date(start);
      end.setDate(end.getDate() + 41); // 42 days total (0-41 = 42 days)
      
      return eachDayOfInterval({ start, end });
    }
    return [currentDate]; // day view
  }, [currentDate, view]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = workingHoursRange.start; hour < workingHoursRange.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHoursRange.interval) {
        slots.push({ hour, minute });
      }
    }
    return slots;
  }, [workingHoursRange]);

  // Function to get status colors - обновлено под реальные статусы API
  const getStatusColors = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          hover: 'hover:bg-green-200'
        };
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-100', 
          text: 'text-blue-800',
          hover: 'hover:bg-blue-200'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          hover: 'hover:bg-purple-200'
        };
      case 'CANCELLED':
      case 'CANCELED':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800', 
          hover: 'hover:bg-red-200'
        };
      case 'PENDING':
      default:
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          hover: 'hover:bg-yellow-200'
        };
    }
  };

  // Function to get master colors by name
  const getMasterColor = (staffName: string) => {
    const colorMap: { [key: string]: string } = {
      'Anna Kowalska': '#8B5CF6',     // Фиолетовый
      'Maria Nowak': '#6366F1',       // Индиго
      'Petra Wiśniewska': '#10B981',  // Изумрудный
      'Olga Lewandowska': '#F59E0B',  // Оранжевый
      'CRM Owner': '#6B7280'          // Серый для системного пользователя
    };
    return colorMap[staffName] || '#9CA3AF'; // Серый по умолчанию
  };

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => {
      // Convert UTC time to Polish timezone for filtering
      const utcDate = new Date(apt.startAt);
      const polandOffset = 1 * 60; // UTC+1 in minutes
      const localDate = new Date(utcDate.getTime() + (polandOffset * 60 * 1000));
      return isSameDay(localDate, day);
    });
  };

  const getAppointmentPosition = (appointment: CalendarAppointment) => {
    // Convert UTC time to Polish timezone for positioning
    const utcStart = new Date(appointment.startAt);
    const utcEnd = new Date(appointment.endAt);
    const polandOffset = 1 * 60; // UTC+1 in minutes
    
    const start = new Date(utcStart.getTime() + (polandOffset * 60 * 1000));
    const end = new Date(utcEnd.getTime() + (polandOffset * 60 * 1000));
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const workingStartMinutes = workingHoursRange.start * 60;
    const topPosition = ((startMinutes - workingStartMinutes) / workingHoursRange.interval) * 3.5; // Increased from 2rem to 3.5rem for better visibility
    
    const duration = differenceInMinutes(end, start);
    const height = Math.max((duration / workingHoursRange.interval) * 3.5, 3.5); // Minimum height 3.5rem
    
    return { top: topPosition, height };
  };

  // Helper function to check if day is a non-working day
  const isNonWorkingDay = (day: Date): boolean => {
    const dayOfWeek = day.getDay();
    
    // Проверяем общие рабочие часы салона
    const dayWorkingHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    const salonIsWorking = dayWorkingHours ? dayWorkingHours.isWorkingDay : false;
    
    
    // Если салон не работает в этот день, проверяем есть ли мастера с персональными графиками
    if (!salonIsWorking && staffSchedules) {
      // Проверяем есть ли хотя бы один мастер, который работает в этот день
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dayOfWeek];
      
      // Ищем среди всех мастеров тех, кто работает в этот день
      const hasWorkingStaff = Object.values(staffSchedules).some((schedule: any) => {
        return schedule[dayName]?.isWorkingDay === true;
      });
      
      return !hasWorkingStaff; // День некликабельный только если никто не работает
    }
    
    return !salonIsWorking;
  };

  const handleSlotClick = (day: Date, slot: { hour: number; minute: number }) => {
    const datetime = new Date(day);
    datetime.setHours(slot.hour, slot.minute, 0, 0);
    
    // Блокировка записи на прошедшее время
    const now = new Date();
    if (datetime < now) {
      return; // Не вызываем onSlotClick для прошедшего времени
    }
    
    // Блокировка записи в выходные дни
    if (isNonWorkingDay(day)) {
      return; // Не вызываем onSlotClick для выходных дней
    }
    
    // Блокировка записи вне рабочих часов
    if (!isWithinWorkingHoursSlot(workingHours, day, slot.hour, slot.minute)) {
      return; // Не вызываем onSlotClick для нерабочего времени
    }
    
    onSlotClick(datetime);
  };

  const formatTimeSlot = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  if (loading || workingHoursLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Ładowanie kalendarza...</p>
        </div>
      </div>
    );
  }

  // Month view requires different layout
  if (view === 'month') {
    return (
      <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="h-full overflow-auto">
          {/* MONTH VIEW LAYOUT */}
          <div className="calendar-month-container">
            {/* Week day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nie'].map((dayName, idx) => (
                <div key={idx} className="p-2 text-center bg-gray-50 border-r border-gray-200 text-xs font-medium text-gray-600">
                  {dayName}
                </div>
              ))}
            </div>
            
            {/* Month grid */}
            <div className="grid grid-cols-7">
              {days.map((day, dayIndex) => {
                const isPastDay = day < new Date(new Date().setHours(0, 0, 0, 0));
                const isNonWorking = isNonWorkingDay(day);
                
                return (
                <div 
                  key={dayIndex} 
                  className={`min-h-[120px] border-r border-b border-gray-200 p-2 relative transition-colors ${
                    !isSameMonth(day, currentDate) 
                      ? 'bg-gray-100 text-gray-400 opacity-60' 
                      : 'bg-white'
                  } ${isToday(day) ? 'bg-blue-50 ring-2 ring-blue-200' : ''} ${
                    isPastDay ? 'bg-gray-50 opacity-60' : 
                    isNonWorking ? 'bg-red-50 opacity-80' : 
                    !isPastDay && !isNonWorking ? 'hover:bg-blue-50 cursor-pointer' : ''
                  }`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isToday(day) ? 'text-blue-600' : isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {/* Индикатор рабочих часов */}
                    {isSameMonth(day, currentDate) && (
                      <div className="text-xs text-gray-500">
                        {isNonWorking ? (
                          <span className="text-red-500">Выходной</span>
                        ) : (
                          (() => {
                            const dayOfWeek = day.getDay();
                            const dayWorkingHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
                            if (dayWorkingHours && dayWorkingHours.isWorkingDay) {
                              return `${dayWorkingHours.startTime}-${dayWorkingHours.endTime}`;
                            }
                            return '';
                          })()
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Appointments for this day */}
                  <div className="space-y-1 relative">
                    {getAppointmentsForDay(day).slice(0, 3).map((appointment) => {
                      // Convert UTC time to Polish timezone for display
                      const utcDate = new Date(appointment.startAt);
                      const polandOffset = 1 * 60; // UTC+1 in minutes
                      const localDate = new Date(utcDate.getTime() + (polandOffset * 60 * 1000));
                      const timeDisplay = format(localDate, 'HH:mm');
                      
                      const statusColors = getStatusColors(appointment.status);
                      
                      const masterColor = getMasterColor(appointment.staffName || '');
                      
                      return (
                        <div
                          key={appointment.id}
                          className={`text-xs p-1 rounded ${statusColors.bg} ${statusColors.text} cursor-pointer ${statusColors.hover} transition-colors truncate relative z-1`}
                          style={{
                            borderLeft: `4px solid ${masterColor}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('[CalendarGrid Month] Appointment clicked:', appointment.id);
                            onAppointmentClick(appointment.id);
                          }}
                        >
                          <div className="font-medium truncate">{appointment.clientName}</div>
                          <div className="truncate">{timeDisplay} - {appointment.serviceNames[0]}</div>
                        </div>
                      );
                    })}
                    
                    {/* Show more indicator */}
                    {getAppointmentsForDay(day).length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{getAppointmentsForDay(day).length - 3} więcej
                      </div>
                    )}
                  </div>
                  
                  {/* Click area for new appointment - lower z-index to not interfere with appointment clicks */}
                  <div 
                    className={`absolute inset-0 transition-colors z-0 ${
                      day < new Date(new Date().setHours(0, 0, 0, 0)) || isNonWorking
                        ? 'cursor-not-allowed' 
                        : !isSameMonth(day, currentDate)
                        ? 'cursor-pointer hover:bg-gray-200 hover:bg-opacity-50'
                        : 'cursor-pointer hover:bg-blue-50 hover:bg-opacity-30'
                    }`}
                    onClick={(e) => {
                      // Only handle click if it's not on an appointment
                      if (e.target === e.currentTarget) {
                        // Block clicks on past days and non-working days
                        if (day < new Date(new Date().setHours(0, 0, 0, 0)) || isNonWorking) {
                          return;
                        }
                        
                        // If clicking on a day from different month, navigate to that month
                        if (!isSameMonth(day, currentDate) && onDateNavigation) {
                          onDateNavigation(day);
                        } else {
                          // Находим подходящее время для записи
                          const dayOfWeek = day.getDay();
                          const dayWorkingHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
                          const isToday = isSameDay(day, new Date());
                          
                          let startHour = 9;
                          let startMinute = 0;
                          
                          if (dayWorkingHours && dayWorkingHours.isWorkingDay && dayWorkingHours.startTime) {
                            const timeParts = dayWorkingHours.startTime.split(':');
                            startHour = parseInt(timeParts[0]);
                            startMinute = parseInt(timeParts[1]);
                          }
                          
                          // Если это сегодня, используем текущее время + 30 минут (округленное вверх)
                          if (isToday) {
                            const now = new Date();
                            const nowHour = now.getHours();
                            const nowMinute = now.getMinutes();
                            
                            // Округляем вверх до ближайших 30 минут и добавляем 30 минут буферного времени
                            let nearestSlotMinutes = nowMinute <= 0 ? 0 : nowMinute <= 30 ? 30 : 0;
                            let nearestSlotHour = nowMinute <= 30 ? nowHour : nowHour + 1;
                            
                            // Добавляем 30 минут буфера
                            nearestSlotMinutes += 30;
                            if (nearestSlotMinutes >= 60) {
                              nearestSlotMinutes = 0;
                              nearestSlotHour += 1;
                            }
                            
                            // Используем либо ближайший слот, либо начало рабочего дня (если ближайший слот раньше)
                            if (nearestSlotHour > startHour || (nearestSlotHour === startHour && nearestSlotMinutes > startMinute)) {
                              startHour = nearestSlotHour;
                              startMinute = nearestSlotMinutes;
                            }
                          }
                          
                          handleSlotClick(day, { hour: startHour, minute: startMinute });
                        }
                      }
                    }}
                  />
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Week and Day view layout (existing)
  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="h-full overflow-auto">
        {/* FRESHA-STYLE GRID */}
        <div className="calendar-grid-container">
          {/* Header Row */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
            <div className="grid" style={{ gridTemplateColumns: days.length === 1 ? '80px 1fr' : '80px repeat(7, 1fr)' }}>
              {/* Time column header */}
              <div className="h-16 border-r border-gray-200 bg-gray-50"></div>
              
              {/* Day headers */}
              {days.map((day, dayIndex) => {
                const isNonWorking = isNonWorkingDay(day);
                return (
                <div 
                  key={dayIndex} 
                  className={`h-16 p-3 text-center border-r border-gray-200 ${
                    isToday(day) ? 'bg-blue-50' : isNonWorking ? 'non-working-day' : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs text-gray-500 uppercase font-medium">
                    {format(day, 'EEE', { locale: pl })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Time Grid */}
          <div className="relative">
            <div className="grid" style={{ gridTemplateColumns: days.length === 1 ? '80px 1fr' : '80px repeat(7, 1fr)' }}>
              {/* Time slots column */}
              <div className="border-r border-gray-200 bg-gray-50">
                {timeSlots.map((slot, index) => (
                  <div 
                    key={index}
                    className="h-14 border-b border-gray-100 flex items-start justify-end pr-3 pt-1"
                  >
                    {slot.minute === 0 && (
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTimeSlot(slot.hour, slot.minute)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => {
                const isDayNonWorking = isNonWorkingDay(day);
                return (
                <div 
                  key={dayIndex} 
                  className={`border-r border-gray-200 relative ${isDayNonWorking ? 'non-working-day' : ''}`}
                >
                  {timeSlots.map((slot, slotIndex) => {
                    // Проверяем является ли слот прошедшим
                    const slotDateTime = new Date(day);
                    slotDateTime.setHours(slot.hour, slot.minute, 0, 0);
                    const isPast = slotDateTime < new Date();
                    
                    // Проверяем является ли слот в рабочих часах салона
                    const isWorkingTime = isWithinWorkingHoursSlot(workingHours, day, slot.hour, slot.minute);
                    
                    // Проверяем доступность персонала (если есть фильтр по персоналу)
                    let isStaffWorkingTime = true;
                    if (staffFilter.length > 0 && Object.keys(staffSchedules).length > 0) {
                      // Если есть фильтр по персоналу, проверяем что хотя бы один из выбранных мастеров работает
                      isStaffWorkingTime = staffFilter.some(staffId => 
                        isStaffAvailable(staffId, day, staffSchedules)
                      );
                    }
                    
                    // Общая доступность слота = салон работает И есть доступный мастер (если выбран фильтр)
                    const isSlotAvailable = isWorkingTime && isStaffWorkingTime;
                    
                    return (
                    <div
                      key={slotIndex}
                      className={`h-14 border-b border-gray-100 transition-colors relative group ${
                        isPast 
                          ? 'past-slot cursor-not-allowed' 
                          : !isSlotAvailable
                          ? 'non-working-hours cursor-not-allowed bg-gray-50'
                          : 'hover:bg-blue-50 cursor-pointer'
                      }`}
                      onClick={() => handleSlotClick(day, slot)}
                    >
                      {/* Hover indicator */}
                      {!isPast && isSlotAvailable && (
                        <div className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
                      )}
                      
                      {/* Time indicator on hover */}
                      {slot.minute === 0 && (
                        <div className="absolute top-1 left-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTimeSlot(slot.hour, slot.minute)}
                        </div>
                      )}
                    </div>
                    );
                  })}

                  {/* Current time line */}
                  {isToday(day) && <CurrentTimeLine />}

                  {/* Appointments */}
                  {getAppointmentsForDay(day).map((appointment) => {
                    const position = getAppointmentPosition(appointment);
                    const masterColor = getMasterColor(appointment.staffName || '');
                    return (
                      <AppointmentBlock
                        key={appointment.id}
                        appointment={appointment}
                        masterColor={masterColor}
                        style={{
                          position: 'absolute',
                          top: `${position.top}rem`,
                          height: `${position.height}rem`,
                          left: '6px',
                          right: '6px',
                          zIndex: 1
                        }}
                        onClick={() => onAppointmentClick(appointment.id)}
                        onDrop={onAppointmentDrop}
                      />
                    );
                  })}
                </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
