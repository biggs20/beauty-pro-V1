'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { createClient } from '@/lib/supabase';
import { Clock, User, Scissors, Calendar as CalendarIcon } from 'lucide-react';

// Initialize moment localizer
const localizer = momentLocalizer(moment);

// Simple UI components (since you might not have shadcn/ui yet)
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'outline' 
        ? 'border border-gray-300 bg-white hover:bg-gray-50' 
        : 'bg-blue-600 text-white hover:bg-blue-700'
    } ${size === 'sm' ? 'px-2 py-1 text-sm' : ''} ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: any) => (
  <div className="px-6 py-4 border-b border-gray-200">
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant] || variantClasses.default}`}>
      {children}
    </span>
  );
};

// Types for our appointment system
interface Appointment extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  clientName: string;
  stylistName: string;
  serviceName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  servicePrice: number;
  clientPhone?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
}

interface Stylist {
  id: string;
  full_name: string;
  role: string;
}

const AppointmentCalendar: React.FC = () => {
  // State management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const supabase = createClient();

  // Fetch appointments from Supabase
  const fetchAppointments = async () => {
    try {
      const { data: appointmentsData, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id(full_name, phone),
          stylist:stylist_id(full_name),
          service:service_id(name, price, category)
        `)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true });

      if (appointmentError) throw appointmentError;

      // Transform data for react-big-calendar
      const formattedAppointments: Appointment[] = appointmentsData?.map(apt => ({
        id: apt.id,
        title: `${apt.service?.name} - ${apt.client?.full_name}`,
        start: new Date(apt.start_time),
        end: new Date(apt.end_time),
        clientName: apt.client?.full_name || 'Unknown Client',
        stylistName: apt.stylist?.full_name || 'Unknown Stylist',
        serviceName: apt.service?.name || 'Unknown Service',
        status: apt.status,
        notes: apt.notes,
        servicePrice: apt.service?.price || 0,
        clientPhone: apt.client?.phone
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch stylists
  const fetchStylists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'stylist')
        .order('full_name');

      if (error) throw error;
      setStylists(data || []);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointments(),
        fetchServices(),
        fetchStylists()
      ]);
      setLoading(false);
    };

    initializeData();
  }, []);

  // Real-time subscriptions for live updates
  useEffect(() => {
    const appointmentSubscription = supabase
      .channel('appointments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Appointment updated:', payload);
          fetchAppointments(); // Refresh appointments
        }
      )
      .subscribe();

    return () => {
      appointmentSubscription.unsubscribe();
    };
  }, []);

  // Custom event styling based on appointment status
  const eventStyleGetter = (event: Appointment) => {
    let backgroundColor = '#3174ad'; // default blue
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#10b981'; // green
        break;
      case 'completed':
        backgroundColor = '#6b7280'; // gray
        break;
      case 'cancelled':
        backgroundColor = '#ef4444'; // red
        break;
      default:
        backgroundColor = '#3b82f6'; // blue
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  // Handle appointment selection
  const handleSelectEvent = (event: Appointment) => {
    setSelectedAppointment(event);
  };

  // Custom toolbar component
  const CustomToolbar = ({ label, onView, onNavigate, view: currentView }: any) => (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('PREV')}
        >
          ←
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
          {label}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('NEXT')}
        >
          →
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('TODAY')}
          className="ml-2"
        >
          Today
        </Button>
      </div>
      
      <div className="flex gap-2">
        {(['month', 'week', 'day'] as View[]).map((v) => (
          <Button
            key={v}
            variant={currentView === v ? "default" : "outline"}
            size="sm"
            onClick={() => onView(v)}
            className="capitalize"
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Calendar Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => 
                    moment(apt.start).isSame(moment(), 'day')
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => 
                    moment(apt.start).isSame(moment(), 'week')
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Stylists</p>
                <p className="text-2xl font-bold text-gray-900">{stylists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Scissors className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Appointment Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar
              }}
              step={15}
              timeslots={4}
              min={new Date(2024, 0, 1, 8, 0)} // 8 AM
              max={new Date(2024, 0, 1, 20, 0)} // 8 PM
              defaultView="week"
              popup={true}
              tooltipAccessor={(event: Appointment) => 
                `${event.serviceName} with ${event.stylistName}\n${moment(event.start).format('h:mm A')} - ${moment(event.end).format('h:mm A')}`
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Modal/Sidebar */}
      {selectedAppointment && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Appointment Details
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedAppointment(null)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Client</label>
                  <p className="text-gray-900">{selectedAppointment.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stylist</label>
                  <p className="text-gray-900">{selectedAppointment.stylistName}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Service</label>
                  <p className="text-gray-900">{selectedAppointment.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Price</label>
                  <p className="text-gray-900">${selectedAppointment.servicePrice}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date & Time</label>
                  <p className="text-gray-900">
                    {moment(selectedAppointment.start).format('MMMM Do, YYYY')}
                  </p>
                  <p className="text-gray-600">
                    {moment(selectedAppointment.start).format('h:mm A')} - {moment(selectedAppointment.end).format('h:mm A')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={
                      selectedAppointment.status === 'confirmed' ? 'default' :
                      selectedAppointment.status === 'completed' ? 'secondary' :
                      selectedAppointment.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }>
                      {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="text-gray-900 mt-1">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm" variant="outline">
                  Reschedule
                </Button>
                <Button size="sm" variant="outline">
                  Cancel
                </Button>
                <Button size="sm">
                  Mark Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-600">Status Legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;



