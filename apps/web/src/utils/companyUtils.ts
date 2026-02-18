import { Company } from '@tgt/shared';

/**
 * Deduplicates an array of companies based on their ID.
 * Ensures that if multiple companies have the same ID, only the first one is kept.
 * Also filters out any companies with null or undefined IDs.
 * 
 * @param companies Array of Company objects
 * @returns Deduplicated array of Company objects
 */
export const deduplicateCompanies = (companies: Company[]): Company[] => {
    if (!companies || !Array.isArray(companies)) {
        return [];
    }

    const seenIds = new Set<string>();

    return companies.filter(company => {
        if (!company || !company.id) {
            return false;
        }

        if (seenIds.has(company.id)) {
            return false;
        }

        seenIds.add(company.id);
        return true;
    });
};
