import React from 'react';
import { motion } from 'framer-motion';
import { Company } from '@tgt/shared';
import CompanyCard from '@/components/CompanyCard';
import { deduplicateCompanies } from '@/utils/companyUtils';
import EmptyState from '@/components/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

interface CompanyGridProps {
    companies: Company[];
    loading: boolean;
}

const CompanyGrid: React.FC<CompanyGridProps> = ({ companies, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-full">
                        <LoadingSkeleton className="h-[400px] rounded-[32px]" />
                    </div>
                ))}
            </div>
        );
    }

    const uniqueCompanies = deduplicateCompanies(companies);

    if (uniqueCompanies.length === 0) {
        return (
            <div className="py-24 bg-white rounded-[48px] border border-slate-200">
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {uniqueCompanies.map((company, index) => (
                <motion.div
                    // Fallback key strategy: ID + index ensures uniqueness even if ID is missing or duplicated 
                    // (although deduplicateCompanies handles ID duplication, this is an extra shield)
                    key={company.id ? `${company.id}-${index}` : `company-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <CompanyCard company={company} />
                </motion.div>
            ))}
        </div>
    );
};

export default CompanyGrid;
