import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import { Service, DbCompany } from '@tgt/shared';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import SEO from '@/components/SEO';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import HiringForm from '@/components/booking/HiringForm';
import { SERVICE_CATEGORIES } from '@/data/serviceDefinitions';
import Button from '@/components/ui/Button';

const BookingPage = () => {
    const { serviceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tier = searchParams.get('tier') || 'basic';

    const [service, setService] = useState<Service | null>(null);
    const [company, setCompany] = useState<DbCompany | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string, endDate?: string } | null>(null);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const subcategoryData = SERVICE_CATEGORIES.flatMap(cat => cat.subcategories).find(sub => sub.id === (service as any)?.subcategory);
    const questions = subcategoryData?.hiringQuestions || [];

    useEffect(() => {
        const fetchService = async () => {
            if (!serviceId) return;
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select('*, company:companies(*)')
                    .eq('id', serviceId)
                    .single();

                if (error) throw error;
                setService(data);
                setCompany(data.company);
            } catch (error) {
                console.error("Error loading service", error);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [serviceId]);

    const handleBookingSelect = (date: string, time: string, endDate?: string) => {
        setSelectedSlot({ date, time, endDate });
        // Auto-scroll to form if questions exist
        if (questions.length > 0) {
            setTimeout(() => {
                document.getElementById('hiring-form')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const handleContinueToCheckout = () => {
        if (!selectedSlot) return;

        // Validate form
        const newErrors: Record<string, string> = {};
        questions.forEach(q => {
            if (q.required && !responses[q.id]) {
                newErrors[q.id] = "Este campo é obrigatório.";
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            return;
        }

        const { date, time, endDate } = selectedSlot;
        let url = `/checkout/${serviceId}?tier=${tier}&date=${date}&time=${time}`;
        if (endDate) {
            url += `&endDate=${endDate}`;
        }

        // Pass responses as base64 encoded JSON to avoid URL issues
        if (Object.keys(responses).length > 0) {
            // Robust base64 encoding for UTF-8
            const encodedResponses = btoa(unescape(encodeURIComponent(JSON.stringify(responses))));
            url += `&responses=${encodedResponses}`;
        }

        navigate(url);
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    if (!service || !company) return <div className="h-screen flex items-center justify-center">Serviço não encontrado.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <SEO title={`Agendar ${service.title} | CONTRATTO`} />
            <div className="container mx-auto px-4 max-w-4xl">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-brand-primary transition-colors mb-8 group"
                >
                    <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Voltar ao serviço</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Agendar Horário</h1>
                        <p className="text-gray-600 mt-2">Escolha o melhor momento para o seu atendimento com <span className="font-bold text-gray-900">{company.company_name}</span></p>
                    </div>
                    <div className="bg-brand-primary/5 px-4 py-2 rounded-lg border border-brand-primary/10">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Serviço Selecionado</span>
                        <span className="text-sm font-bold text-gray-900 truncate block max-w-[200px]">{service.title}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <BookingCalendar
                        service={service}
                        company={company}
                        onSelect={handleBookingSelect}
                    />

                    {selectedSlot && questions.length > 0 && (
                        <div id="hiring-form" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <HiringForm
                                questions={questions}
                                responses={responses}
                                onResponseChange={(id, value) => {
                                    setResponses(prev => ({ ...prev, [id]: value }));
                                    if (formErrors[id]) {
                                        setFormErrors(prev => {
                                            const newErrors = { ...prev };
                                            delete newErrors[id];
                                            return newErrors;
                                        });
                                    }
                                }}
                                errors={formErrors}
                            />
                        </div>
                    )}

                    {selectedSlot && (
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleContinueToCheckout}
                                className="w-full md:w-auto px-12"
                            >
                                Continuar para Pagamento
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center bg-white p-6 rounded-2xl border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">
                        Após selecionar o horário, você será redirecionado para o checkout seguro.
                        O pagamento confirma o seu agendamento.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
