import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const DashboardAdministradoresPage: React.FC = () => {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Administradores</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Gerencie quem tem acesso ao painel da sua empresa.
                </p>
            </div>
            {/* List of current admins would go here */}

            <form className="space-y-8 divide-y divide-gray-200 pt-6">
                 <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Adicionar Novo Administrador</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mt-4">
                        <div className="sm:col-span-3">
                            <Input label="Nome Completo" id="adminName"/>
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="CPF" id="adminCpf"/>
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Email" id="adminEmail" type="email"/>
                        </div>
                         <div className="sm:col-span-3">
                            <Input label="Telefone (Opcional)" id="adminPhone" type="tel"/>
                        </div>
                    </div>
                </div>

                <div className="pt-5">
                    <div className="flex justify-end">
                        <Button type="submit">
                           Adicionar Administrador
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DashboardAdministradoresPage;