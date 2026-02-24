import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { HiringQuestion } from '@/data/serviceDefinitions';

interface HiringFormProps {
    questions: HiringQuestion[];
    responses: Record<string, any>;
    onResponseChange: (id: string, value: any) => void;
    errors?: Record<string, string>;
}

const HiringForm: React.FC<HiringFormProps> = ({
    questions,
    responses,
    onResponseChange,
    errors = {}
}) => {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200">
            <div className="border-b border-gray-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Informações Adicionais</h3>
                <p className="text-sm text-gray-500 mt-1">
                    Responda as perguntas abaixo para que o profissional entenda melhor sua necessidade.
                </p>
            </div>

            <div className="space-y-6">
                {questions.map((q) => (
                    <div key={q.id}>
                        {q.type === 'text' && (
                            <Input
                                label={q.question}
                                placeholder={q.placeholder}
                                value={responses[q.id] || ''}
                                onChange={(e) => onResponseChange(q.id, e.target.value)}
                                required={q.required}
                                helperText={errors[q.id]}
                                className={errors[q.id] ? "border-red-500" : ""}
                            />
                        )}

                        {q.type === 'number' && (
                            <Input
                                type="number"
                                label={q.question}
                                placeholder={q.placeholder}
                                value={responses[q.id] || ''}
                                onChange={(e) => onResponseChange(q.id, e.target.value)}
                                required={q.required}
                                helperText={errors[q.id]}
                                className={errors[q.id] ? "border-red-500" : ""}
                            />
                        )}

                        {q.type === 'textarea' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {q.question} {q.required && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    value={responses[q.id] || ''}
                                    onChange={(e) => onResponseChange(q.id, e.target.value)}
                                    className={`w-full px-3 py-2 border border-gray-300 rounded-[var(--radius-box)] shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-24 resize-none ${errors[q.id] ? "border-red-500" : ""}`}
                                    placeholder={q.placeholder}
                                />
                                {errors[q.id] && <p className="text-xs text-red-500 mt-1">{errors[q.id]}</p>}
                            </div>
                        )}

                        {q.type === 'select' && q.options && (
                            <Select
                                label={q.question}
                                value={responses[q.id] || ''}
                                onChange={(value) => onResponseChange(q.id, value)}
                                options={q.options.map(opt => ({ label: opt, value: opt }))}
                                placeholder="Selecione uma opção..."
                            />
                        )}

                        {q.type === 'checkbox' && (
                            <div className="flex items-start">
                                <div className="flex h-5 items-center">
                                    <input
                                        id={q.id}
                                        type="checkbox"
                                        checked={!!responses[q.id]}
                                        onChange={(e) => onResponseChange(q.id, e.target.checked)}
                                        className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor={q.id} className="font-medium text-gray-700">
                                        {q.question}
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HiringForm;
