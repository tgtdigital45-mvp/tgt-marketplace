import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@tgt/shared';
import JobCard, { Job } from '@/components/pro/JobCard';
import { Search } from 'lucide-react';

const ProFindJobsPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    category:categories(name)
                `)
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform data if necessary to match Job interface
            // Supabase returns object, we need to ensure structure matches
            setJobs(data as unknown as Job[]);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
                    <p className="text-gray-500 text-sm mt-1">Encontre novos clientes procurando seus serviços</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-8">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por título, descrição ou cidade..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma oportunidade encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros de busca.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map(job => (
                        <JobCard key={job.id} job={job} companySlug={slug || ''} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProFindJobsPage;
