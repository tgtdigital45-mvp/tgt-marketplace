import React, { useState, useEffect } from 'react';
import { Button } from '@tgt/ui-web';
import { calculateProjectFees } from '@tgt/core';
import { X, FileText, DollarSign } from 'lucide-react';

interface ProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (proposalData: { description: string; totalValue: number; upfrontPercentage: number; estimatedDuration?: string; notes?: string }) => Promise<void>;
    isProCompany?: boolean;
    isSending?: boolean;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    isProCompany = false,
    isSending = false
}) => {
    const [description, setDescription] = useState('');
    const [totalValue, setTotalValue] = useState<number | ''>('');
    const [upfrontPercentage, setUpfrontPercentage] = useState<number>(30);
    const [estimatedDuration, setEstimatedDuration] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setTotalValue('');
            setUpfrontPercentage(30);
            setEstimatedDuration('');
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const fees = totalValue ? calculateProjectFees(Number(totalValue), isProCompany, upfrontPercentage) : null;

    const handleSubmit = async () => {
        if (!description || !totalValue || isSending) return;
        await onSubmit({
            description,
            totalValue: Number(totalValue),
            upfrontPercentage,
            estimatedDuration: estimatedDuration.trim() || undefined,
            notes: notes.trim() || undefined,
        });
    };

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-brand-primary" />
                        <h3 className="font-bold text-lg text-gray-900">Enviar Proposta Transparente</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Escopo do Serviço</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva detalhadamente o que será entregue..."
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none min-h-[100px]"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Valor Total (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={totalValue}
                                    onChange={(e) => setTotalValue(Number(e.target.value) || '')}
                                    placeholder="0,00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Condição</label>
                            <select
                                value={upfrontPercentage}
                                onChange={(e) => setUpfrontPercentage(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white"
                            >
                                <option value={30}>30% Inicial / 70% Final</option>
                                <option value={50}>50% Inicial / 50% Final</option>
                                <option value={100}>100% Antecipado</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Prazo Estimado <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <input
                                type="text"
                                value={estimatedDuration}
                                onChange={(e) => setEstimatedDuration(e.target.value)}
                                placeholder="Ex: 3 dias úteis"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Notas ao Cliente <span className="text-gray-400 font-normal">(opcional)</span></label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Observações adicionais..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                        </div>
                    </div>

                    {fees && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <div className="flex items-center gap-2 mb-2 text-brand-primary">
                                <DollarSign className="w-5 h-5" />
                                <span className="font-bold text-sm">Simulador de Ganhos</span>
                            </div>

                            <div className="grid grid-cols-2 text-sm gap-y-2">
                                <span className="text-gray-500">Valor Cobrado:</span>
                                <span className="font-medium text-right">{formatCurrency(fees.totalValue)}</span>

                                <span className="text-gray-500">Taxa TGT ({(fees.platformFee / fees.totalValue * 100).toFixed(1)}%):</span>
                                <span className="text-red-500 text-right">-{formatCurrency(fees.platformFee)}</span>

                                <span className="text-gray-500">Taxa Stripe:</span>
                                <span className="text-red-500 text-right">-{formatCurrency(fees.stripeFee)}</span>
                            </div>

                            <div className="pt-2 border-t border-gray-200 mt-2 flex justify-between items-center text-emerald-700 font-bold">
                                <span>Você Recebe Líquido (Total):</span>
                                <span className="text-lg">{formatCurrency(fees.sellerNet)}</span>
                            </div>

                            <div className="mt-2 text-xs text-center bg-white border border-gray-200 px-3 py-2 rounded-lg text-gray-600">
                                Deste total, o cliente pagará <strong>{formatCurrency(fees.upfrontAmount)}</strong> ({upfrontPercentage}%) para reservar e iniciar o projeto.
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <Button variant="secondary" onClick={onClose} disabled={isSending}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isSending} disabled={!totalValue || !description}>
                        Enviar Proposta
                    </Button>
                </div>
            </div>
        </div>
    );
};
