import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MOCK_COMPANIES } from '../constants';
import { Company, Service, Review } from '../types';

export interface Message {
    id: string;
    senderName: string;
    senderEmail: string;
    content: string;
    date: string;
    read: boolean;
    companyId: string;
}

export interface Appointment {
    id: string;
    clientId: string;
    clientName: string;
    companyId: string;
    serviceId: string;
    serviceName: string;
    date: string;
    time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    price: number;
    notes?: string;
    createdAt: string;
}

interface MockContextType {
    companies: Company[];
    loading: boolean;
    updateCompany: (id: string, data: Partial<Company>) => void;
    addService: (companyId: string, service: Omit<Service, 'id'>) => void;
    removeService: (companyId: string, serviceId: string) => void;
    sendMessage: (companyId: string, message: Omit<Message, 'id' | 'date' | 'read'>) => void;
    getMessages: (companyId: string) => Message[];
    searchCompanies: (query: string) => Company[];
    appointments: Appointment[];
    requestAppointment: (data: Omit<Appointment, 'id' | 'status' | 'createdAt'>) => void;
    updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
    getCompanyAppointments: (companyId: string) => Appointment[];
    getClientAppointments: (clientId: string) => Appointment[];
    addReview: (companyId: string, review: { rating: number; comment: string; author: string; avatar?: string }) => void;
}

const MockContext = createContext<MockContextType | undefined>(undefined);

export const MockProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    // Initialize data from LocalStorage or Constants
    useEffect(() => {
        const loadData = () => {
            try {
                // Companies
                const savedCompanies = localStorage.getItem('tgt_mock_companies_v3');
                if (savedCompanies) {
                    setCompanies(JSON.parse(savedCompanies));
                } else {
                    setCompanies(MOCK_COMPANIES);
                }

                // Messages
                const savedMessages = localStorage.getItem('tgt_mock_messages_v3');
                if (savedMessages) {
                    setMessages(JSON.parse(savedMessages));
                } else {
                    setMessages([]);
                }

                // Appointments
                const savedAppointments = localStorage.getItem('tgt_mock_appointments_v3');
                if (savedAppointments) {
                    setAppointments(JSON.parse(savedAppointments));
                } else {
                    setAppointments([]);
                }
            } catch (error) {
                console.error("Failed to load mock data", error);
                setCompanies(MOCK_COMPANIES);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Persistence Effects
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('tgt_mock_companies_v3', JSON.stringify(companies));
        }
    }, [companies, loading]);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem('tgt_mock_messages_v3', JSON.stringify(messages));
        }
    }, [messages, loading]);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem('tgt_mock_appointments_v3', JSON.stringify(appointments));
        }
    }, [appointments, loading]);

    // Actions
    const updateCompany = (id: string, data: Partial<Company>) => {
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    };

    const addService = (companyId: string, serviceData: Omit<Service, 'id'>) => {
        setCompanies(prev => prev.map(c => {
            if (c.id === companyId) {
                const newService: Service = {
                    ...serviceData,
                    id: Math.random().toString(36).substr(2, 9),
                };
                return { ...c, services: [...c.services, newService] };
            }
            return c;
        }));
    };

    const removeService = (companyId: string, serviceId: string) => {
        setCompanies(prev => prev.map(c => {
            if (c.id === companyId) {
                return { ...c, services: c.services.filter(s => s.id !== serviceId) };
            }
            return c;
        }));
    };

    const sendMessage = (companyId: string, messageData: Omit<Message, 'id' | 'date' | 'read' | 'companyId'>) => {
        const newMessage: Message = {
            ...messageData,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            read: false,
            companyId: companyId
        };
        setMessages(prev => [newMessage, ...prev]);
    };

    const getMessages = (companyId: string) => {
        return messages.filter(m => m.companyId === companyId);
    };

    const searchCompanies = (query: string) => {
        const lowerQuery = query.toLowerCase();
        return companies.filter(c =>
            c.companyName.toLowerCase().includes(lowerQuery) ||
            c.category.toLowerCase().includes(lowerQuery) ||
            c.services.some(s => s.title.toLowerCase().includes(lowerQuery))
        );
    };

    const requestAppointment = (data: Omit<Appointment, 'id' | 'status' | 'createdAt'>) => {
        const newAppointment: Appointment = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        setAppointments(prev => [newAppointment, ...prev]);
    };

    const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const getCompanyAppointments = (companyId: string) => {
        return appointments.filter(a => a.companyId === companyId);
    };

    const getClientAppointments = (clientId: string) => {
        return appointments.filter(a => a.clientId === clientId);
    };

    const addReview = (companyId: string, reviewData: { rating: number; comment: string; author: string; avatar?: string }) => {
        setCompanies(prev => prev.map(c => {
            if (c.id === companyId) {
                const newReview: Review = {
                    id: Math.random().toString(36).substr(2, 9),
                    author: reviewData.author,
                    avatar: reviewData.avatar || 'https://i.pravatar.cc/150?u=default',
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    date: new Date().toLocaleDateString('pt-BR')
                };

                const updatedReviews = [newReview, ...c.reviews];
                const newRating = updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length;

                return {
                    ...c,
                    reviews: updatedReviews,
                    rating: parseFloat(newRating.toFixed(1)),
                    reviewCount: updatedReviews.length
                };
            }
            return c;
        }));
    };

    return (
        <MockContext.Provider value={{
            companies,
            loading,
            updateCompany,
            addService,
            removeService,
            sendMessage,
            getMessages,
            searchCompanies,
            appointments,
            requestAppointment,
            updateAppointmentStatus,
            getCompanyAppointments,
            getClientAppointments,
            addReview
        }}>
            {children}
        </MockContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMockData = () => {
    const context = useContext(MockContext);
    if (context === undefined) {
        throw new Error('useMockData must be used within a MockProvider');
    }
    return context;
};
