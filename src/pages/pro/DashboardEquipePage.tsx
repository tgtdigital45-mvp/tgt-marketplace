import React from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';

const DashboardEquipePage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-brand-primary/10 p-6 rounded-full mb-6 relative">
                <UserGroupIcon className="w-16 h-16 text-brand-primary" />
                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    BETA
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">Gestão de Equipe</h1>
            <p className="text-lg text-gray-600 max-w-md mb-8">
                Estamos construindo uma nova experiência para você gerenciar seu time, definir permissões e acompanhar o desempenho de cada membro.
            </p>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-2xl w-full text-left">
                <h3 className="font-semibold text-gray-900 mb-4">O que vem por aí?</h3>
                <ul className="space-y-3">
                    <li className="flex items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                        <span className="text-gray-600">Convite de novos membros por e-mail</span>
                    </li>
                    <li className="flex items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                        <span className="text-gray-600">Definição de cargos e permissões personalizadas</span>
                    </li>
                    <li className="flex items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                        <span className="text-gray-600">Histórico de atividades por membro</span>
                    </li>
                    <li className="flex items-start">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mr-3 mt-0.5">✓</span>
                        <span className="text-gray-600">Metas individuais e coletivas</span>
                    </li>
                </ul>
            </div>

            <div className="mt-8 flex gap-4">
                <Button variant="outline" onClick={() => window.history.back()}>
                    Voltar
                </Button>
                <Button onClick={() => window.open('mailto:contato@tgt.com', '_blank')}>
                    Ser notificado quando lançar
                </Button>
            </div>
        </div>
    );
};

export default DashboardEquipePage;
