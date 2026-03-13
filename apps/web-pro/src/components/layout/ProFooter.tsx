import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.ex.com';

const FOOTER_LINKS = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Agendamentos', href: '/dashboard' },
      { label: 'Orçamentos', href: '/dashboard' },
      { label: 'Faturamento', href: '/dashboard' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Como funciona', href: '/como-funciona' },
      { label: 'Planos e Preços', href: '/planos' },
      { label: 'Verificação', href: '/ajuda' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de Ajuda', href: '/ajuda' },
      { label: 'Fale Conosco', href: '/contato' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Termos de Uso', href: '/termos' },
    ],
  },
];

const ProFooter: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14 pb-8">

        {/* Top row: brand + tagline */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 mb-10 pb-10 border-b border-slate-800">
          <div className="max-w-xs">
            <Link to="/" className="inline-block mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="/logo-contratto.png"
                  alt="CONTRATTO"
                  className="h-10 w-auto brightness-0 invert opacity-90"
                />
                <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
                  Parceiros
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              A plataforma completa para empresas gerenciarem serviços, agendamentos, orçamentos e equipe em um só lugar.
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                Dados criptografados com SSL
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                Acesso restrito a empresas verificadas
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="lg:text-right">
            <p className="text-sm text-slate-400 mb-3">Ainda não tem uma conta?</p>
            <a
              href={`${PORTAL_URL}/cadastro`}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
            >
              Cadastrar empresa
            </a>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-xs font-semibold text-white tracking-wider uppercase mb-4">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} CONTRATTO Parceiros. Todos os direitos reservados.
          </p>
          <a
            href="https://contrattoex.com"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Ir para o marketplace →
          </a>
        </div>
      </div>
    </footer>
  );
};

export default ProFooter;
