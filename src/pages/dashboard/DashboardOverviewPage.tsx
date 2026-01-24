import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import AnimatedSection from '../../components/ui/AnimatedSection';
import Badge from '../../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Icons
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;

const DashboardOverviewPage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState([
        { title: 'Visualizações do Perfil', value: '0', change: '0%', icon: <EyeIcon />, color: 'bg-blue-500' },
        { title: 'Agendamentos Pendentes', value: '0', change: '0', icon: <ChatIcon />, color: 'bg-green-500' },
        { title: 'Avaliação Média', value: '5.0', change: '0%', icon: <StarIcon />, color: 'bg-yellow-500' },
    ]);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);

    // Mock Data for Charts (Replace with API data later)
    const viewsData = [
        { name: 'Seg', views: 400 },
        { name: 'Ter', views: 300 },
        { name: 'Qua', views: 600 },
        { name: 'Qui', views: 800 },
        { name: 'Sex', views: 500 },
        { name: 'Sab', views: 900 },
        { name: 'Dom', views: 700 },
    ];

    const quotesData = [
        { name: 'Jan', quotes: 12 },
        { name: 'Fev', quotes: 19 },
        { name: 'Mar', quotes: 3 },
        { name: 'Abr', quotes: 5 },
        { name: 'Mai', quotes: 2 },
        { name: 'Jun', quotes: 30 },
    ];

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            // Get Company ID
            const { data: company } = await supabase.from('companies').select('id, company_name').eq('profile_id', user.id).single();
            if (!company) return;

            // Get Pending Bookings Count
            const { count } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company.id)
                .eq('status', 'pending');

            // Get Recent Bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setStats(prev => [
                { ...prev[0], value: '1.245', change: '+12%' }, // Mock Views
                { ...prev[1], value: (count || 0).toString() },
                { ...prev[2], value: '4.8' }  // Mock Rating
            ]);

            setRecentBookings(bookings || []);
        };

        fetchData();
    }, [user]);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
                <p className="text-gray-500">Acompanhe o desempenho do seu negócio.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <AnimatedSection key={index} delay={index * 0.1}>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                                            <dd className="flex items-baseline">
                                                <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                                                {stat.change && (
                                                    <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {stat.change}
                                                    </div>
                                                )}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatedSection delay={0.2} className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Visualizações (Últimos 7 dias)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={viewsData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AnimatedSection>

                <AnimatedSection delay={0.3} className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Crescimento de Orçamentos</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={quotesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="quotes" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </AnimatedSection>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Bookings */}
                <AnimatedSection delay={0.3} className="bg-white shadow rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Solicitações Recentes</h3>
                        <Link to="/dashboard/empresa/agendamentos" className="text-sm text-brand-primary hover:underline">Ver todas</Link>
                    </div>
                    {recentBookings.length === 0 ? (
                        <p className="text-gray-500">Nenhuma solicitação recente.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {recentBookings.map((booking) => (
                                <li key={booking.id} className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{booking.service_title}</p>
                                            <p className="text-sm text-gray-500">{new Date(booking.booking_date).toLocaleDateString()}</p>
                                        </div>
                                        <Badge variant={booking.status === 'pending' ? 'warning' : 'success'}>
                                            {booking.status === 'pending' ? 'Pendente' : booking.status}
                                        </Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </AnimatedSection>

                {/* Quick Tips */}
                <AnimatedSection delay={0.4} className="bg-indigo-50 border border-indigo-100 shadow rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-indigo-900 mb-4">Dicas para seu negócio</h3>
                    <ul className="list-disc list-inside text-indigo-800 space-y-2">
                        <li>Responda aos orçamentos em até 1 hora.</li>
                        <li>Mantenha seus serviços atualizados com preços reais.</li>
                        <li>Peça avaliações aos clientes após concluir um serviço.</li>
                    </ul>
                </AnimatedSection>
            </div>
        </div>
    );
};

export default DashboardOverviewPage;
