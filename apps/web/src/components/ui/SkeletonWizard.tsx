import React from 'react';

/**
 * Skeleton para ServiceWizard
 * Imita a estrutura do wizard de criação de serviços
 */
const SkeletonWizard: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="border-b border-gray-100 p-6">
                    <div className="flex items-center justify-between max-w-2xl mx-auto">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mb-2" />
                                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                                </div>
                                {step < 3 && (
                                    <div className="w-24 h-0.5 bg-gray-200 mx-4 animate-pulse" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 240px)' }}>
                    {/* Form fields skeleton */}
                    <div className="space-y-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-32 w-full bg-gray-100 rounded-lg animate-pulse" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                            <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                            <div className="h-12 w-full bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex items-center justify-between">
                    <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-10 w-32 bg-gray-300 rounded-lg animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonWizard;
