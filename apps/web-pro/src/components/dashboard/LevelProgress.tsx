import React from 'react';

interface LevelProgressProps {
    level: string; // 'Iniciante' | 'Nível 1' | 'Pro'
    salesCount: number;
    rating: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ level, salesCount, rating }) => {
    // Define criteria
    // Nível 1: > 5 vendas + rating > 4.5
    // Pro: > 50 vendas + verificação (simulated by sales > 50 + rating > 4.8)

    let nextLevel = '';
    let salesTarget = 0;
    let ratingTarget = 0;
    let progress = 0;

    if (level === 'Iniciante') {
        nextLevel = 'Nível 1';
        salesTarget = 6; // Need > 5, so 6
        ratingTarget = 4.5;
    } else if (level === 'Nível 1') {
        nextLevel = 'Pro';
        salesTarget = 51; // Need > 50
        ratingTarget = 4.8;
    } else {
        // Max level
        return (
            <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 rounded-xl shadow-lg border border-gray-800">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        Nível Pro
                    </h3>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase">Máximo</span>
                </div>
                <p className="text-gray-400 text-sm">Você alcançou o topo! Continue mantendo sua excelência.</p>
            </div>
        );
    }

    // Calculate Progress (Simple Average of Sales % and Rating Check)
    // Actually, distinct bars are better
    const salesProgress = Math.min((salesCount / salesTarget) * 100, 100);
    const ratingProgress = Math.min((rating / 5) * 100, 100); // Visual only, threshold is strict

    // Check if rating requirement is met
    const isRatingGood = rating > ratingTarget;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-1">Próxima Conquista: {nextLevel}</h3>
            <p className="text-xs text-gray-500 mb-4">Complete os requisitos para subir de nível e ganhar destaque.</p>

            <div className="space-y-4">
                {/* Sales Progress */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">Vendas Concluídas</span>
                        <span className="text-brand-primary font-bold">{salesCount} / {salesTarget}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-brand-primary h-2.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${salesProgress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Rating Requirement */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">Avaliação Média</span>
                        <span className={`${isRatingGood ? 'text-green-600' : 'text-orange-500'} font-bold`}>
                            {rating.toFixed(1)} / {ratingTarget}
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${isRatingGood ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${(rating / 5) * 100}%` }} // Showing absolute rating on bar
                        ></div>
                    </div>
                    {!isRatingGood && (
                        <p className="text-[10px] text-orange-500 mt-1">
                            * Mantenha sua avaliação acima de {ratingTarget}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LevelProgress;
