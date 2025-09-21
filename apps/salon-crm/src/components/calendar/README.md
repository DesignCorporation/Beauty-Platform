# Beauty Platform CRM - Calendar Module

## 📅 Overview
Comprehensive calendar module for Beauty Platform CRM with advanced appointment management, drag & drop functionality, and real-time updates.

## ✨ Features
- **Multi-view Calendar**: Day, Week, Month views
- **Real-time Updates**: Live appointment sync and status updates
- **Drag & Drop**: Move appointments between time slots
- **Advanced Filtering**: Filter by staff members and appointment statuses
- **Modal Details**: Detailed appointment view with status management
- **Responsive Design**: Mobile-friendly interface
- **Real-time Indicator**: Red line showing current time
- **Tenant Isolation**: Secure multi-tenant data separation

## 🏗️ Architecture

### Components Structure
```
src/components/calendar/
├── CalendarGrid.tsx          # Main calendar grid with time slots
├── AppointmentBlock.tsx      # Individual appointment display
├── CalendarFilters.tsx       # Sidebar filters (staff/status)
├── AppointmentModal.tsx      # Appointment details modal
└── CurrentTimeLine.tsx       # Real-time indicator line
```

### Hooks
```
src/hooks/
├── useAppointments.ts        # Appointment data management
└── useTenant.ts             # Tenant context (salonId, token)
```

### Types
```
src/types/calendar.ts         # TypeScript interfaces
```

## 🎯 Key Features Detail

### 1. Calendar Grid
- **Time Slots**: 7:00-22:00 with 30-minute intervals
- **Working Days**: Monday-Sunday support
- **Visual Indicators**: Today highlighting, current time line
- **Click Handling**: Empty slot clicks for new appointments

### 2. Appointment Management
- **Status System**: Pending, Confirmed, Completed, Canceled
- **Color Coding**: Visual status representation
- **Drag & Drop**: Move between slots and staff members
- **Duration Display**: Automatic duration calculation

### 3. Filtering System
- **Staff Filter**: Show/hide appointments by staff member
- **Status Filter**: Filter by appointment status
- **Real-time Updates**: Instant filter application
- **Staff Colors**: Custom color coding for staff members

### 4. Security & Data
- **Tenant Isolation**: JWT-based salon separation
- **API Integration**: Secure API calls with Bearer tokens
- **Error Handling**: Comprehensive error states and recovery

## 🔧 Technical Details

### API Endpoints
```typescript
// Fetch appointments
GET /api/v1/crm/appointments?date=2025-01-28&view=week&staffIds=123&statuses=CONFIRMED

// Update appointment status
PATCH /api/v1/crm/appointments/{id}/status

// Reschedule appointment
POST /api/v1/crm/appointments/{id}/reschedule

// Fetch staff list
GET /api/v1/crm/staff
```

### Data Flow
1. **Authentication**: JWT token from localStorage
2. **Tenant Context**: Extract salonId from JWT payload
3. **API Calls**: All requests include Authorization header
4. **State Management**: React hooks for data synchronization
5. **Real-time Updates**: Optimistic UI updates with error recovery

### Key Interfaces
```typescript
interface CalendarAppointment {
  id: string;
  clientName: string;
  staffName: string;
  serviceNames: string[];
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  price: number;
  currency: string;
}

interface AppointmentFilters {
  staffIds: string[];
  statuses: AppointmentStatus[];
}
```

## 🎨 Styling
- **Tailwind CSS**: Utility-first styling
- **Custom CSS**: Calendar-specific styles in `calendar.css`
- **Responsive**: Mobile-first design approach
- **Polish Localization**: Date formatting with Polish locale

## 🚀 Usage

### Basic Integration
```typescript
import CalendarPage from './pages/CalendarPage';

// The component handles all calendar functionality
<CalendarPage />
```

### Custom Filtering
```typescript
const [filters, setFilters] = useState<AppointmentFilters>({
  staffIds: ['staff-1', 'staff-2'],
  statuses: ['CONFIRMED', 'PENDING']
});
```

### Navigation
```typescript
// View switching
setView('week'); // 'day' | 'week' | 'month'

// Date navigation
setCurrentDate(new Date());
```

## 🔒 Security Considerations
- **Tenant Isolation**: All data filtered by salonId
- **JWT Validation**: Token expiration handling
- **API Security**: Bearer token authentication
- **Error Boundaries**: Graceful error handling

## 📱 Responsive Design
- **Desktop**: Full calendar grid with sidebar
- **Tablet**: Collapsible sidebar, compact view
- **Mobile**: Stacked layout, simplified controls

## 🌍 Localization
- **Polish Language**: UI text and date formatting
- **Date Formatting**: Using date-fns with Polish locale
- **Currency**: PLN formatting with proper locale

## 🔄 State Management
- **Local State**: React useState for UI state
- **Server State**: Custom hooks for API data
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Automatic retry mechanisms

## 🎯 Performance Optimizations
- **Memo Components**: Prevent unnecessary re-renders
- **Optimized Re-renders**: Strategic dependency arrays
- **Lazy Loading**: Components loaded on demand
- **Efficient Updates**: Minimal API calls with smart caching

## 🧪 Testing Recommendations
- **Unit Tests**: Individual component testing
- **Integration Tests**: API integration testing
- **E2E Tests**: Full calendar workflow testing
- **Accessibility**: Screen reader and keyboard navigation

## 📝 TODO / Future Enhancements
- [ ] Recurring appointments support
- [ ] Bulk operations (multi-select)
- [ ] Calendar export (iCal/Google Calendar)
- [ ] Advanced scheduling conflicts detection
- [ ] Client booking preferences
- [ ] SMS/Email notifications integration
- [ ] Resource management (rooms, equipment)
- [ ] Advanced reporting and analytics

## 🔧 Development Setup
1. **Install Dependencies**: All required packages in package.json
2. **Import Styles**: Calendar CSS imported in main.tsx
3. **API Integration**: Ensure backend endpoints are available
4. **Authentication**: JWT token management in place

## 📊 Performance Metrics
- **Initial Load**: < 2s for calendar view
- **Appointment Updates**: < 500ms response time
- **Filter Changes**: Instant UI updates
- **Mobile Performance**: Optimized for 3G connections

---

**Note**: This calendar module is part of the Beauty Platform CRM and requires proper authentication and tenant context to function correctly.
