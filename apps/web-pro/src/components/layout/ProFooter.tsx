import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, MessageCircle } from 'lucide-react';

const ProFooter: React.FC = () => {
  return (
    <footer className="py-20 bg-white border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-slate-800">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6 text-slate-950">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="font-display text-xl font-bold tracking-tight">CONTRATTO</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Liderando a próxima geração de automação operacional para profissionais e empresas do Paraná.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors pointer-events-none opacity-50"><Globe size={18} /></div>
              <div className="w-10 h-10 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary-600 transition-colors pointer-events-none opacity-50"><MessageCircle size={18} /></div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest bg-slate-100 px-3 py-1 rounded-full w-fit">Plataforma</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link to="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
              <li><Link to="/planos" className="hover:text-primary-600 transition-colors">Preços</Link></li>
              <li><Link to="/updates" className="hover:text-primary-600 transition-colors">Updates</Link></li>
              <li><Link to="/cases" className="hover:text-primary-600 transition-colors">Cases de Sucesso</Link></li>
              <li><Link to="/blog" className="hover:text-primary-600 transition-colors">Blog & Insights</Link></li>
              <li><Link to="/contato" className="hover:text-primary-600 transition-colors">Suporte</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest bg-slate-100 px-3 py-1 rounded-full w-fit">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link to="/privacidade" className="hover:text-primary-600 transition-colors">Privacidade</Link></li>
              <li><Link to="/termos" className="hover:text-primary-600 transition-colors">Termos de Uso</Link></li>
              <li><Link to="/ajuda" className="hover:text-primary-600 transition-colors">Central de Ajuda</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-widest bg-slate-100 px-3 py-1 rounded-full w-fit">Localização</h4>
            <div className="text-sm text-slate-500 leading-relaxed font-medium">
              <p className="text-slate-900 font-bold mb-1">Curitiba Hub</p>
              <p>Av. Batel, 1550</p>
              <p>80420-000 - PR, Brasil</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <p>© 2026 CONTRATTO. Powered by Advanced AI.</p>
          <div className="flex gap-6">
            <span className="text-primary-600/50">Curitiba • São Paulo • Florianópolis</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ProFooter;
