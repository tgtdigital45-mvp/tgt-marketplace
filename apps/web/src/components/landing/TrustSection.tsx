import React from 'react';
import { deduplicateCompanies } from '@/utils/companyUtils';
import { motion } from 'framer-motion';
import { useVerifiedCompanies } from '@/hooks/useVerifiedCompanies';
import CompanyCard from '@/components/CompanyCard';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Company } from '@tgt/shared';

const TrustSection: React.FC = () => {
    // Fetch verified companies
    const { data: companies, isLoading } = useVerifiedCompanies({ limit: 4 });

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="text-primary-600 font-bold tracking-widest uppercase text-xs mb-2 block">
                            Segurança em primeiro lugar
                        </span>
                        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                            Empresas Verificadas
                        </h2>
                    </div>
                    <Link
                        to="/empresas"
                        className="group flex items-center gap-2 text-slate-500 font-bold hover:text-primary-600 transition-colors"
                    >
                        Ver todas as empresas <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-80 bg-gray-100 rounded-[24px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {deduplicateCompanies(companies || []).map((company: Partial<Company>, index: number) => (
                            <motion.div
                                key={company.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Cast to any if CompanyCard props mismatch partial, or rely on CompanyCard handling it */}
                                {/* Assuming CompanyCard takes Company, we might need to be careful with Partial */}
                                <CompanyCard company={company as Company} />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default TrustSection;
