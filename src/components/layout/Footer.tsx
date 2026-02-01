import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t-4 border-brand-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Soluções</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/para-empresas" className="text-base text-gray-500 hover:text-brand-primary">Para Empresas</Link></li>
              <li><Link to="/para-clientes" className="text-base text-gray-500 hover:text-brand-primary">Para Clientes</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Suporte</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/ajuda" className="text-base text-gray-500 hover:text-gray-900">Ajuda</Link></li>
              <li><Link to="/contato" className="text-base text-gray-500 hover:text-gray-900">Fale Conosco</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Empresa</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/sobre" className="text-base text-gray-500 hover:text-gray-900">Sobre</Link></li>
              <li><Link to="/carreiras" className="text-base text-gray-500 hover:text-gray-900">Carreiras</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Serviços Populares</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/?q=Pedreiro" className="text-base text-gray-500 hover:text-gray-900">Pedreiros</Link></li>
              <li><Link to="/?q=Eletricista" className="text-base text-gray-500 hover:text-gray-900">Eletricistas</Link></li>
              <li><Link to="/?q=Encanador" className="text-base text-gray-500 hover:text-gray-900">Encanadores</Link></li>
              <li><Link to="/?q=Pintor" className="text-base text-gray-500 hover:text-gray-900">Pintores</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Cidades Atendidas</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/?loc=Sao Paulo" className="text-base text-gray-500 hover:text-gray-900">São Paulo</Link></li>
              <li><Link to="/?loc=Rio de Janeiro" className="text-base text-gray-500 hover:text-gray-900">Rio de Janeiro</Link></li>
              <li><Link to="/?loc=Belo Horizonte" className="text-base text-gray-500 hover:text-gray-900">Belo Horizonte</Link></li>
              <li><Link to="/?loc=Curitiba" className="text-base text-gray-500 hover:text-gray-900">Curitiba</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li><Link to="/privacidade" className="text-base text-gray-500 hover:text-gray-900">Privacidade</Link></li>
              <li><Link to="/termos" className="text-base text-gray-500 hover:text-gray-900">Termos</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-6 mb-4 md:mb-0 md:order-2">
            <div className="flex items-center text-xs text-gray-400">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL Seguro
            </div>
            <div className="flex items-center text-xs text-gray-400">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Dados Criptografados
            </div>
          </div>
          <p className="text-base text-gray-400 md:order-1">
            &copy; {new Date().getFullYear()} TGT Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
