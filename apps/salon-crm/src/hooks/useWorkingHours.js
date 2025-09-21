// Заглушка для хука рабочих часов
import { useState, useEffect } from 'react';
export const useWorkingHours = () => {
    const [workingHours, setWorkingHours] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // Временная заглушка - стандартные рабочие часы
        const defaultHours = [
            { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Monday
            { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Tuesday  
            { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Wednesday
            { id: '4', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Thursday
            { id: '5', dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isWorkingDay: true }, // Friday
            { id: '6', dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isWorkingDay: true }, // Saturday
            { id: '7', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false }, // Sunday
        ];
        setWorkingHours(defaultHours);
        setLoading(false);
    }, []);
    return {
        workingHours,
        loading,
        refetch: () => { },
    };
};
// Утилитарные функции
export const isWithinWorkingHours = (date, workingHours) => {
    const dayOfWeek = date.getDay();
    const timeString = date.toTimeString().substring(0, 5); // "HH:mm"
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!dayHours || !dayHours.isWorkingDay) {
        return false;
    }
    return timeString >= dayHours.startTime && timeString <= dayHours.endTime;
};
// Перегруженная версия для удобства использования в календаре
export const isWithinWorkingHoursSlot = (workingHours, day, hour, minute) => {
    const date = new Date(day);
    date.setHours(hour, minute, 0, 0);
    return isWithinWorkingHours(date, workingHours);
};
// Получение общего диапазона рабочих часов (для календарной сетки)
export const getOverallWorkingHoursRange = (workingHours) => {
    if (!workingHours || workingHours.length === 0) {
        return { earliestHour: 9, latestHour: 18 };
    }
    const workingDays = workingHours.filter(wh => wh.isWorkingDay);
    if (workingDays.length === 0) {
        return { earliestHour: 9, latestHour: 18 };
    }
    let earliestHour = 24;
    let latestHour = 0;
    workingDays.forEach(day => {
        if (day.startTime && day.endTime) {
            const startHour = parseInt(day.startTime.split(':')[0]);
            let endHour = parseInt(day.endTime.split(':')[0]);
            if (endHour === 0)
                endHour = 24; // Handle midnight
            earliestHour = Math.min(earliestHour, startHour);
            latestHour = Math.max(latestHour, endHour);
        }
    });
    return {
        earliestHour: Math.max(0, earliestHour),
        latestHour: Math.min(24, latestHour)
    };
};
export const getWorkingHoursRange = (date, workingHours) => {
    // Проверяем что date действительно объект Date
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Invalid date passed to getWorkingHoursRange:', date);
        return null;
    }
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    if (!dayHours || !dayHours.isWorkingDay) {
        return null;
    }
    return {
        start: dayHours.startTime,
        end: dayHours.endTime
    };
};
