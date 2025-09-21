// Экспорт всех сервисов Client Portal
export { csrfService, CSRFService } from './csrf'
export { clientApi, ClientApiService } from './api'

// Type definitions for common API responses
export interface ClientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  avatar?: string
  preferences?: {
    language: string
    notifications: boolean
    reminders: boolean
  }
}

export interface Salon {
  id: string
  name: string
  description?: string
  address: string
  phone: string
  email?: string
  website?: string
  rating?: number
  images?: string[]
  services: Service[]
  workingHours: WorkingHours[]
}

export interface Service {
  id: string
  name: string
  description?: string
  duration: number // в минутах
  price: number
  category: string
}

export interface WorkingHours {
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  isOpen: boolean
  startTime?: string // HH:mm
  endTime?: string // HH:mm
}

export interface Booking {
  id: string
  salonId: string
  salon: Pick<Salon, 'id' | 'name' | 'address' | 'phone'>
  serviceId: string
  service: Pick<Service, 'id' | 'name' | 'duration' | 'price'>
  staffId: string
  staff: {
    id: string
    name: string
    avatar?: string
  }
  date: string // YYYY-MM-DD
  time: string // HH:mm
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
  notes?: string
  createdAt: string
  updatedAt: string
}

// Error types
export interface ApiError {
  message: string
  code?: string
  details?: any
}