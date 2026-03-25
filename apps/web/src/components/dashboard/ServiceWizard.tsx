/**
 * ServiceWizard — Multi-step wizard for creating and editing services.
 *
 * Step components live in ./steps/ to keep this file focused on
 * orchestration logic (state, navigation, validation, submit).
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@tgt/core';
import { resolveServiceType } from '@tgt/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@tgt/ui-web';
import { devLog } from '@/utils/logger';

import StepOverview from './steps/StepOverview';
import StepPricing from './steps/StepPricing';
import StepGallery from './steps/StepGallery';

import type { WizardFormData, WizardErrors, ServiceWizardProps } from './wizard.types';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step: number, data: WizardFormData): WizardErrors {
    const errors: WizardErrors = {};

    if (step === 0) {
        if (!data.title.trim()) errors.title = 'Nome do serviço é obrigatório.';
        if (!data.category) errors.category = 'Selecione uma categoria.';
    }

    if (step === 1 && data.priceType !== 'budget') {
        const basicPrice = data.packages?.basic?.price ?? 0;
        if (basicPrice <= 0) errors.packages = 'Defina um preço maior que zero.';
    }

    return errors;
}

// ─── Step registry ────────────────────────────────────────────────────────────

const STEPS = [
    { title: 'Geral', component: StepOverview },
    { title: 'Preço', component: StepPricing },
    { title: 'Galeria', component: StepGallery },
] as const;

// ─── Wizard ───────────────────────────────────────────────────────────────────

const ServiceWizard = ({ onCancel, initialData, onSuccess }: ServiceWizardProps) => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<WizardErrors>({});
    const [formData, setFormData] = useState<WizardFormData>({
        title: (initialData?.title as string) || '',
        category: (initialData?.category_tag as string) || '',
        subcategory: (initialData?.subcategory as string) || '',
        priceType: (initialData?.requires_quote ? 'budget' : (initialData?.is_single_package ? 'fixed' : 'packages')) as WizardFormData['priceType'],
        locationType: ((initialData?.location_type as string) || 'in_store') as WizardFormData['locationType'],
        description: (initialData?.description as string) || '',
        tags: Array.isArray(initialData?.tags) ? (initialData.tags as string[]).join(', ') : '',
        packages: (initialData?.packages as WizardFormData['packages']) || {},
        gallery: (initialData?.gallery as string[]) || [],
        questions: (initialData?.service_forms as Array<{ questions: string[] }>)?.[0]?.questions || [],
        attributes: (initialData?.attributes as Record<string, string>) || {},
        registrationNumber: (initialData?.registration_number as string) || '',
        registrationState: (initialData?.registration_state as string) || '',
        meetingUrl: (initialData?.meeting_url as string) || '',
        addressId: (initialData?.address_id as string) || '',
        radiusKm: (initialData?.radius_km as number) || 0,
        travelFee: (initialData?.travel_fee as number) || 0,
    });

    const isEditing = !!initialData;

    const handleSubmit = async () => {
        if (!user) return;

        const finalErrors = validateStep(currentStep, formData);
        if (Object.keys(finalErrors).length > 0) {
            setErrors(finalErrors);
            return;
        }

        setLoading(true);
        try {
            const { data: company } = await supabase
                .from('companies')
                .select('id, h3_index')
                .eq('profile_id', user.id)
                .single();

            if (!company) throw new Error('Empresa não encontrada.');

            const servicePayload = {
                company_id: company.id,
                title: formData.title,
                description: formData.description,
                price: formData.packages?.basic?.price || 0,
                starting_price: formData.packages?.basic?.price || 0,
                packages: formData.priceType === 'fixed' ? { basic: formData.packages.basic } : formData.packages,
                gallery: formData.gallery,
                service_type: resolveServiceType(formData.priceType, formData.locationType),
                location_type: formData.locationType,
                h3_index: formData.locationType === 'remote' ? null : company.h3_index,
                category_tag: formData.category,
                subcategory: formData.subcategory,
                is_single_package: formData.priceType === 'fixed',
                requires_quote: formData.priceType === 'budget',
                tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
                attributes: formData.attributes,
                registration_number: formData.registrationNumber,
                registration_state: formData.registrationState,
                meeting_url: formData.meetingUrl,
                address_id: formData.addressId,
                radius_km: formData.radiusKm,
                travel_fee: formData.travelFee,
            };

            devLog('[ServiceWizard] service_type:', servicePayload.service_type, '| location_type:', servicePayload.location_type);

            const { data: service, error } = isEditing
                ? await supabase.from('services').update(servicePayload).eq('id', initialData.id as string).select().single()
                : await supabase.from('services').insert([servicePayload]).select().single();

            if (error) throw error;

            if (formData.priceType === 'budget') {
                await supabase.from('service_forms').upsert(
                    { service_id: service.id, questions: formData.questions },
                    { onConflict: 'service_id' }
                );
            }

            addToast(isEditing ? 'Atualizado!' : 'Criado!', 'success');
            if (onSuccess) onSuccess();
            else navigate('/dashboard/servicos');
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Erro ao salvar serviço.';
            addToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        const stepErrors = validateStep(currentStep, formData);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            return;
        }
        setErrors({});
        if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
        else handleSubmit();
    };

    const handleBack = () => {
        setErrors({});
        if (currentStep === 0) onCancel?.();
        else setCurrentStep(s => s - 1);
    };

    const { component: CurrentComponent } = STEPS[currentStep];

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Progress header */}
            <div className="bg-gray-50 p-4 border-b flex justify-between">
                {STEPS.map((s, i) => (
                    <div key={s.title} className={`flex items-center ${i === currentStep ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 border-2 ${i === currentStep ? 'border-primary-600' : 'border-gray-300'}`}>
                            {i + 1}
                        </div>
                        <span>{s.title}</span>
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="p-8 min-h-[400px]">
                <CurrentComponent
                    data={formData}
                    updateData={(d: Partial<WizardFormData>) => setFormData(p => ({ ...p, ...d }))}
                    errors={errors}
                />
            </div>

            {/* Navigation */}
            <div className="p-4 border-t flex justify-between">
                <Button variant="secondary" onClick={handleBack}>Voltar</Button>
                <Button variant="primary" onClick={handleNext} isLoading={loading}>
                    {currentStep === STEPS.length - 1 ? 'Salvar' : 'Próximo'}
                </Button>
            </div>
        </div>
    );
};

export default ServiceWizard;
