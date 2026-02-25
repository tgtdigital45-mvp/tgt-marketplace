import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-8">
        {/* Top Row: Brand + Newsletter */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-12 pb-10 border-b border-slate-800">
          <div className="max-w-sm">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo-contratto.png" alt="CONTRATTO" className="h-10 sm:h-12 w-auto brightness-0 invert opacity-90" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              A maior rede corporativa de serviços locais. Conectamos empresas e profissionais com seguranca e qualidade.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              SSL Seguro
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Dados Criptografados
            </div>
          </div>
        </div>

        {/* Link Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 sm:gap-6 mb-12">
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Solucoes</h3>
            <ul className="space-y-3">
              <li><Link to="/para-empresas" className="text-sm text-slate-400 hover:text-brand-primary transition-colors">Para Empresas</Link></li>
              <li><Link to="/para-clientes" className="text-sm text-slate-400 hover:text-brand-primary transition-colors">Para Clientes</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Suporte</h3>
            <ul className="space-y-3">
              <li><Link to="/ajuda" className="text-sm text-slate-400 hover:text-white transition-colors">Ajuda</Link></li>
              <li><Link to="/contato" className="text-sm text-slate-400 hover:text-white transition-colors">Fale Conosco</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Empresa</h3>
            <ul className="space-y-3">
              <li><Link to="/sobre" className="text-sm text-slate-400 hover:text-white transition-colors">Sobre</Link></li>
              <li><Link to="/carreiras" className="text-sm text-slate-400 hover:text-white transition-colors">Carreiras</Link></li>
              <li><Link to="/blog" className="text-sm text-slate-400 hover:text-white transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Categorias</h3>
            <ul className="space-y-3">
              <li><Link to="/?q=Desenvolvimento" className="text-sm text-slate-400 hover:text-white transition-colors">Desenvolvimento</Link></li>
              <li><Link to="/?q=Design" className="text-sm text-slate-400 hover:text-white transition-colors">Design</Link></li>
              <li><Link to="/?q=Marketing" className="text-sm text-slate-400 hover:text-white transition-colors">Marketing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Em Alta</h3>
            <ul className="space-y-3">
              <li><Link to="/?q=React" className="text-sm text-slate-400 hover:text-white transition-colors">React</Link></li>
              <li><Link to="/?q=Logo" className="text-sm text-slate-400 hover:text-white transition-colors">Design de Logo</Link></li>
              <li><Link to="/?q=SEO" className="text-sm text-slate-400 hover:text-white transition-colors">SEO</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-xs font-semibold text-white tracking-wider uppercase mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacidade" className="text-sm text-slate-400 hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link to="/termos" className="text-sm text-slate-400 hover:text-white transition-colors">Termos</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} CONTRATTO. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-600">Feito com dedicacao no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
