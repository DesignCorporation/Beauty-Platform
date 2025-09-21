import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { format, isSameDay, differenceInMinutes, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { pl } from 'date-fns/locale';
// import { AppointmentModal } from './AppointmentModal'; // Заменено на отдельные страницы
import { useNavigate } from 'react-router-dom';
import { AppointmentBlock } from './AppointmentBlock';
import { CurrentTimeLine } from './CurrentTimeLine';
export const StaffCalendarGrid = ({ appointments, staff, selectedDate, view = 'week', onAppointmentClick, onTimeSlotClick }) => {
    const navigate = useNavigate();
    // Рабочие часы: с 8:00 до 20:00 с интервалом 30 минут
    const workingHoursRange = { start: 8, end: 20, interval: 30 };
    // Определяем дни для отображения (день или неделя)
    const days = useMemo(() => {
        if (view === 'week') {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Понедельник
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        }
        return [selectedDate]; // день
    }, [selectedDate, view]);
    // Генерируем временные слоты
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let hour = workingHoursRange.start; hour < workingHoursRange.end; hour++) {
            for (let minute = 0; minute < 60; minute += workingHoursRange.interval) {
                slots.push({ hour, minute });
            }
        }
        return slots;
    }, [workingHoursRange]);
    // Фильтруем записи только мастеров (STAFF_MEMBER)
    const staffMembers = staff.filter(member => member.role === 'STAFF_MEMBER');
    // Функция для получения записей для конкретного дня
    const getAppointmentsForDay = (day) => {
        return appointments.filter(apt => {
            const utcDate = new Date(apt.startAt);
            const polandOffset = 1 * 60; // UTC+1 в минутах
            const localDate = new Date(utcDate.getTime() + (polandOffset * 60 * 1000));
            return isSameDay(localDate, day);
        });
    };
    // Функция для получения записей всех дней (неиспользуемая, удаляем)
    // const allDaysAppointments = useMemo(() => {
    //   return days.flatMap(day => getAppointmentsForDay(day));
    // }, [days, appointments]);
    // Функция для получения записи для конкретного мастера и времени (неиспользуемая, удаляем)
    // const getAppointmentAtTime = (staffId: string, day: Date, slot: { hour: number; minute: number }) => {
    //   const dayAppointments = getAppointmentsForDay(day);
    //   const slotTime = new Date(day);
    //   slotTime.setHours(slot.hour, slot.minute, 0, 0);
    //   
    //   return dayAppointments.find(apt => {
    //     const aptStart = new Date(apt.startAt);
    //     const aptEnd = new Date(apt.endAt);
    //     return apt.staffId === staffId && 
    //              aptStart <= slotTime && 
    //              aptEnd > slotTime;
    //   });
    // };
    // Функция для расчета позиции записи
    const getAppointmentPosition = (appointment) => {
        const utcStart = new Date(appointment.startAt);
        const utcEnd = new Date(appointment.endAt);
        const polandOffset = 1 * 60; // UTC+1 в минутах
        const start = new Date(utcStart.getTime() + (polandOffset * 60 * 1000));
        const end = new Date(utcEnd.getTime() + (polandOffset * 60 * 1000));
        const startMinutes = start.getHours() * 60 + start.getMinutes();
        const workingStartMinutes = workingHoursRange.start * 60;
        const topPosition = ((startMinutes - workingStartMinutes) / workingHoursRange.interval) * 3.5;
        const duration = differenceInMinutes(end, start);
        const height = Math.max((duration / workingHoursRange.interval) * 3.5, 3.5);
        return { top: topPosition, height };
    };
    // Функция для получения цвета мастера
    const getMasterColor = (staffName) => {
        const colorMap = {
            'Anna Kowalska': '#8B5CF6',
            'Maria Nowak': '#6366F1',
            'Petra Wiśniewska': '#10B981',
            'Olga Lewandowska': '#F59E0B',
            'CRM Owner': '#6B7280'
        };
        return colorMap[staffName] || '#9CA3AF';
    };
    // Обработка клика по записи - навигация на отдельную страницу
    const handleAppointmentClick = (appointment) => {
        console.log('[StaffCalendarGrid] Appointment clicked:', appointment.id);
        navigate(`/appointments/${appointment.id}`);
        onAppointmentClick?.(appointment);
    };
    // Обработка клика по пустому слоту
    const handleTimeSlotClick = (staffId, day, slot) => {
        const datetime = new Date(day);
        datetime.setHours(slot.hour, slot.minute, 0, 0);
        // Блокировка записи на прошедшее время
        const now = new Date();
        if (datetime < now) {
            return;
        }
        onTimeSlotClick?.(staffId, datetime);
    };
    // Функция для форматирования времени
    const formatTimeSlot = (hour, minute) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };
    return (_jsx("div", { className: "h-full bg-white rounded-lg border border-gray-200 overflow-hidden", children: _jsxs("div", { className: "h-full overflow-auto", children: [_jsxs("div", { className: "sticky top-0 z-30 bg-white border-b border-gray-200 p-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: view === 'week'
                                ? `Календарь мастеров: ${format(days[0], 'dd.MM')} - ${format(days[6], 'dd.MM.yyyy')}`
                                : `Календарь мастеров на ${format(selectedDate, 'dd.MM.yyyy')}` }), _jsxs("p", { className: "text-sm text-gray-600", children: [staffMembers.length, " \u043C\u0430\u0441\u0442\u0435\u0440\u043E\u0432 \u0432 \u043A\u043E\u043C\u0430\u043D\u0434\u0435"] })] }), _jsxs("div", { className: "calendar-grid-container", children: [_jsx("div", { className: "sticky top-[88px] z-20 bg-white border-b border-gray-200", children: _jsxs("div", { className: "grid", style: { gridTemplateColumns: `80px repeat(${staffMembers.length}, 1fr)` }, children: [_jsx("div", { className: "h-16 border-r border-gray-200 bg-gray-50" }), staffMembers.map((staff) => (_jsxs("div", { className: "h-16 p-3 text-center border-r border-gray-200 bg-gray-50", children: [_jsxs("div", { className: "flex items-center justify-center space-x-2 mb-1", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: staff.color || '#6366f1' } }), _jsxs("span", { className: "font-medium text-gray-900 text-sm truncate", children: [staff.firstName, " ", staff.lastName.charAt(0), "."] })] }), _jsx("div", { className: "text-xs text-gray-500", children: staff.role === 'STAFF_MEMBER' ? 'Мастер' : staff.role })] }, staff.id)))] }) }), view === 'week' && (_jsx("div", { className: "sticky top-[152px] z-10 bg-white border-b border-gray-200", children: _jsxs("div", { className: "grid", style: { gridTemplateColumns: `80px repeat(${staffMembers.length}, 1fr)` }, children: [_jsx("div", { className: "h-12 border-r border-gray-200 bg-gray-100" }), staffMembers.map(() => (_jsx("div", { className: "border-r border-gray-200 bg-gray-100", children: _jsx("div", { className: "grid grid-cols-7 h-12", children: days.map((day, dayIndex) => (_jsxs("div", { className: `text-center py-1 text-xs ${isToday(day) ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-600'}`, children: [_jsx("div", { className: "text-xs", children: format(day, 'EEE', { locale: pl }) }), _jsx("div", { className: `text-sm font-medium ${isToday(day) ? 'text-blue-600' : ''}`, children: format(day, 'd') })] }, dayIndex))) }) })))] }) })), _jsx("div", { className: "relative", children: _jsxs("div", { className: "grid", style: { gridTemplateColumns: `80px repeat(${staffMembers.length}, 1fr)` }, children: [_jsx("div", { className: "border-r border-gray-200 bg-gray-50", children: timeSlots.map((slot, index) => (_jsx("div", { className: "h-14 border-b border-gray-100 flex items-start justify-end pr-3 pt-1", children: slot.minute === 0 && (_jsx("span", { className: "text-xs text-gray-500 font-medium", children: formatTimeSlot(slot.hour, slot.minute) })) }, index))) }), staffMembers.map((staff) => (_jsxs("div", { className: "border-r border-gray-200 relative", children: [view === 'week' && (_jsx("div", { className: "absolute inset-0", children: _jsx("div", { className: "grid grid-cols-7 h-full", children: days.map((day, dayIndex) => (_jsxs("div", { className: "border-r border-gray-100 relative", children: [timeSlots.map((slot, slotIndex) => {
                                                                const slotDateTime = new Date(day);
                                                                slotDateTime.setHours(slot.hour, slot.minute, 0, 0);
                                                                const isPast = slotDateTime < new Date();
                                                                return (_jsx("div", { className: `h-14 border-b border-gray-100 transition-colors relative group ${isPast ? 'past-slot cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}`, onClick: () => handleTimeSlotClick(staff.id, day, slot), children: !isPast && (_jsx("div", { className: "absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" })) }, slotIndex));
                                                            }), isToday(day) && _jsx(CurrentTimeLine, {}), getAppointmentsForDay(day)
                                                                .filter(apt => apt.staffId === staff.id)
                                                                .map((appointment) => {
                                                                const position = getAppointmentPosition(appointment);
                                                                const masterColor = getMasterColor(appointment.staffName || '');
                                                                return (_jsx(AppointmentBlock, { appointment: appointment, masterColor: masterColor, style: {
                                                                        position: 'absolute',
                                                                        top: `${position.top}rem`,
                                                                        height: `${position.height}rem`,
                                                                        left: '3px',
                                                                        right: '3px',
                                                                        zIndex: 1
                                                                    }, onClick: () => handleAppointmentClick(appointment), onDrop: () => { } }, appointment.id));
                                                            })] }, dayIndex))) }) })), view === 'day' && (_jsxs(_Fragment, { children: [timeSlots.map((slot, slotIndex) => {
                                                        const slotDateTime = new Date(selectedDate);
                                                        slotDateTime.setHours(slot.hour, slot.minute, 0, 0);
                                                        const isPast = slotDateTime < new Date();
                                                        return (_jsx("div", { className: `h-14 border-b border-gray-100 transition-colors relative group ${isPast ? 'past-slot cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}`, onClick: () => handleTimeSlotClick(staff.id, selectedDate, slot), children: !isPast && (_jsx("div", { className: "absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" })) }, slotIndex));
                                                    }), isToday(selectedDate) && _jsx(CurrentTimeLine, {}), getAppointmentsForDay(selectedDate)
                                                        .filter(apt => apt.staffId === staff.id)
                                                        .map((appointment) => {
                                                        const position = getAppointmentPosition(appointment);
                                                        const masterColor = getMasterColor(appointment.staffName || '');
                                                        return (_jsx(AppointmentBlock, { appointment: appointment, masterColor: masterColor, style: {
                                                                position: 'absolute',
                                                                top: `${position.top}rem`,
                                                                height: `${position.height}rem`,
                                                                left: '6px',
                                                                right: '6px',
                                                                zIndex: 1
                                                            }, onClick: () => handleAppointmentClick(appointment), onDrop: () => { } }, appointment.id));
                                                    })] }))] }, staff.id)))] }) })] })] }) }));
};
