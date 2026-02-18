import React, { useState } from 'react';
import { supabase } from '@tgt/shared';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Proposal {
    id: string;
    company_id: string;
    price: number;
    cover_letter: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    company: {
        name: string;
        avatar_url?: string;
    }
}

interface ProposalListProps {
    jobId: string;
    proposals: Proposal[];
    onProposalAccepted: () => void;
}

const ProposalList: React.FC<ProposalListProps> = ({ proposals, onProposalAccepted }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAccept = async (proposal: Proposal) => {
        if (!user) return;
        try {
            setProcessing(proposal.id);

            // 1. Update proposal status
            const { error: propError } = await supabase
                .from('proposals')
                .update({ status: 'accepted' })
                .eq('id', proposal.id);

            if (propError) throw propError;

            // 2. Create Booking
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    client_id: user.id,
                    company_id: proposal.company_id,
                    service_title: 'Serviço contratado via Job', // Ideal would be to fetch Job title
                    service_price: proposal.price,
                    booking_date: new Date().toISOString().split('T')[0], // Default to today/pending
                    status: 'pending',
                    notes: `Contratação via Proposta: ${proposal.cover_letter.substring(0, 50)}...`
                });

            if (bookingError) throw bookingError;

            // 3. Close other proposals? Maybe not automatically, but let's keep it simple.

            // 4. Notify Company
            const { data: companyData } = await supabase
                .from('companies')
                .select('profile_id, slug')
                .eq('id', proposal.company_id)
                .single();

            if (companyData) {
                await supabase.from('notifications').insert({
                    user_id: companyData.profile_id,
                    type: 'proposal_accepted',
                    title: 'Proposta Aceita!',
                    message: `Sua proposta foi aceita! Um novo agendamento foi criado.`,
                    link: `/dashboard/empresa/${companyData.slug}/agendamentos`,
                    read: false
                });
            }

            showToast('Proposta aceita com sucesso! Um agendamento foi criado.', 'success');
            onProposalAccepted();

        } catch (error) {
            console.error('Error accepting proposal:', error);
            showToast('Erro ao aceitar proposta', 'error');
        } finally {
            setProcessing(null);
        }
    };

    if (proposals.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Nenhuma proposta recebida ainda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-4">
            <h4 className="font-semibold text-gray-800">Propostas ({proposals.length})</h4>
            {proposals.map(proposal => (
                <div key={proposal.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <OptimizedImage
                                src={proposal.company?.avatar_url || ''}
                                alt={proposal.company?.name || 'Empresa'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                fallbackSrc={`https://ui-avatars.com/api/?name=${proposal.company?.name || 'E'}&background=random`}
                            />
                            <div>
                                <p className="font-bold text-gray-900">{proposal.company?.name || 'Empresa'}</p>
                                <p className="text-xs text-gray-500">{new Date(proposal.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block font-bold text-lg text-green-700">R$ {proposal.price.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 mb-4 whitespace-pre-wrap">
                        {proposal.cover_letter}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                        >
                            Ver Perfil
                        </Button>
                        {proposal.status === 'pending' && (
                            <Button
                                size="sm"
                                isLoading={processing === proposal.id}
                                onClick={() => handleAccept(proposal)}
                            >
                                Aceitar Proposta
                            </Button>
                        )}
                        {proposal.status === 'accepted' && (
                            <span className="text-green-600 font-bold text-sm self-center">Aceita ✓</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProposalList;
