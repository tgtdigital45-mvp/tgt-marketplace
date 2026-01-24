import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StoreStatusToggle: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status da Loja</p>
            <div className="flex items-center justify-between">
                <span className={`font-bold transition-colors ${isOpen ? 'text-green-600' : 'text-gray-400'}`}>
                    {isOpen ? '🟢 ABERTO' : '🔴 FECHADO'}
                </span>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${isOpen ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                >
                    <motion.span
                        layout
                        className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
                        animate={{ x: isOpen ? 26 : 2 }}
                    />
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                {isOpen
                    ? 'Sua empresa está visível para novos pedidos.'
                    : 'Você não receberá novos pedidos agora.'}
            </p>
        </div>
    );
};

export default StoreStatusToggle;
