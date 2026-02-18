import React from 'react';
import { Link } from 'react-router-dom';

export interface Job {
    id: string;
    title: string;
    description: string;
    city: string;
    state: string;
    budget_min?: number;
    budget_max?: number;
    created_at: string;
    urgency: 'low' | 'medium' | 'high';
    category?: {
        name: string;
    };
}

interface JobCardProps {
    job: Job;
    companySlug: string;
}

const JobCard: React.FC<JobCardProps> = ({ job, companySlug }) => {
    const urgencyColors = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800'
    };

    const urgencyLabels = {
        low: 'Sem pressa',
        medium: 'Esta semana',
        high: 'Urgente'
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 group">
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    {job.category && (
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                            {job.category.name}
                        </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${urgencyColors[job.urgency] || 'bg-gray-100'}`}>
                        {urgencyLabels[job.urgency] || 'Normal'}
                    </span>
                </div>
                <span className="text-xs text-gray-400">
                    {new Date(job.created_at).toLocaleDateString()}
                </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                {job.title}
            </h3>

            <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                {job.description}
            </p>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-50">
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Localização</span>
                    <span className="font-medium text-gray-700">{job.city}/{job.state}</span>
                </div>

                <div className="flex flex-col text-right">
                    <span className="text-gray-400 text-xs">Orçamento</span>
                    <span className="font-semibold text-green-700">
                        {job.budget_min && job.budget_max
                            ? `R$ ${job.budget_min} - ${job.budget_max}`
                            : job.budget_min ? `A partir de R$ ${job.budget_min}` : 'A Combinar'}
                    </span>
                </div>
            </div>

            <Link
                to={`/dashboard/empresa/${companySlug}/oportunidades/${job.id}`}
                className="block mt-4 text-center w-full py-2 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors"
            >
                Ver Detalhes
            </Link>
        </div>
    );
};

export default JobCard;
