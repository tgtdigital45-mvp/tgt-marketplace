import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StoreStatusToggle: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Status da Loja</p>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold transition-colors ${isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isOpen ? 'ONLINE' : 'OFFLINE'}
                </span>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-emerald-500' : 'bg-slate-700'
                        }`}
                >
                    <motion.span
                        layout
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
                        animate={{ x: isOpen ? 22 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                {isOpen
                    ? 'Sua empresa está aceitando novos pedidos.'
                    : 'Novos pedidos estão pausados temporariamente.'}
            </p>
        </div>
    );
};

export default StoreStatusToggle;
