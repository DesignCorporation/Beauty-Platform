// Заглушка для хука расписания персонала
import { useState, useEffect } from 'react';
export const useStaffSchedules = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // Временная заглушка - стандартное расписание для всех мастеров
        const defaultSchedules = [
            // Master 1
            { id: '1-1', staffId: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
            { id: '1-2', staffId: '1', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
            { id: '1-3', staffId: '1', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
            { id: '1-4', staffId: '1', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
            { id: '1-5', staffId: '1', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isWorkingDay: true },
            { id: '1-6', staffId: '1', dayOfWeek: 6, startTime: '10:00', endTime: '15:00', isWorkingDay: true },
            { id: '1-0', staffId: '1', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
            // Master 2  
            { id: '2-1', staffId: '2', dayOfWeek: 1, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
            { id: '2-2', staffId: '2', dayOfWeek: 2, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
            { id: '2-3', staffId: '2', dayOfWeek: 3, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
            { id: '2-4', staffId: '2', dayOfWeek: 4, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
            { id: '2-5', staffId: '2', dayOfWeek: 5, startTime: '10:00', endTime: '18:00', isWorkingDay: true },
            { id: '2-6', staffId: '2', dayOfWeek: 6, startTime: '11:00', endTime: '16:00', isWorkingDay: true },
            { id: '2-0', staffId: '2', dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isWorkingDay: false },
        ];
        setSchedules(defaultSchedules);
        setLoading(false);
    }, []);
    return {
        schedules,
        loading,
        refetch: () => { },
    };
};
// Утилитарная функция для проверки доступности мастера
export const isStaffAvailable = (staffId, date, schedules) => {
    const dayOfWeek = date.getDay();
    const timeString = date.toTimeString().substring(0, 5); // "HH:mm"
    const staffSchedule = schedules.find(s => s.staffId === staffId && s.dayOfWeek === dayOfWeek);
    if (!staffSchedule || !staffSchedule.isWorkingDay) {
        return false;
    }
    return timeString >= staffSchedule.startTime && timeString <= staffSchedule.endTime;
};
