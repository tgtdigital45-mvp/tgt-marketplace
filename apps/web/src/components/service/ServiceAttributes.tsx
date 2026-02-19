import React from 'react';

interface ServiceAttributesProps {
    attributes?: Record<string, string>;
}

const ServiceAttributes: React.FC<ServiceAttributesProps> = ({ attributes }) => {
    if (!attributes || Object.keys(attributes).length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(attributes).map(([key, value]) => (
                <div key={key} className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{key}</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                </div>
            ))}
        </div>
    );
};

export default ServiceAttributes;
