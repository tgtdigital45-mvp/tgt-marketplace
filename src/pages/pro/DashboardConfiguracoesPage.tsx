import React from 'react';
import Button from '../../components/ui/Button';

const DashboardConfiguracoesPage: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Configurações</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste as preferências da sua empresa.
        </p>
      </div>
      <form className="space-y-8 divide-y divide-gray-200">
        <div className="pt-8 space-y-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Horário de Atendimento</h3>
          <p className="mt-1 text-sm text-gray-500">
            Informe seus clientes quando você está disponível.
          </p>
          {/* A more complex implementation would handle this dynamically */}
          <div className="flex items-center justify-between">
            <span>Segunda a Sexta</span>
            <div className="flex items-center space-x-2">
              <label htmlFor="opening-time" className="sr-only">Horário de abertura</label>
              <input
                type="time"
                id="opening-time"
                defaultValue="09:00"
                className="border-gray-300 rounded-md shadow-sm"
              />
              <span>às</span>
              <label htmlFor="closing-time" className="sr-only">Horário de fechamento</label>
              <input
                type="time"
                id="closing-time"
                defaultValue="18:00"
                className="border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>
        </div>
        <div className="pt-5">
          <div className="flex justify-end">
            <Button type="submit" className="ml-3">
              Salvar alterações
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DashboardConfiguracoesPage;