import React from 'react';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-white pt-24 pb-12 rounded-t-[40px] mt-12">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div>
                        <h2 className="text-3xl font-black mb-6 tracking-tight">CONTRATTO.</h2>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            A plataforma definitiva para conectar pessoas e negócios. Tecnologia, segurança e crescimento em um só lugar.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-primary transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-primary transition-colors">
                                <Linkedin size={20} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-primary transition-colors">
                                <Facebook size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Plataforma</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link to="/empresas" className="hover:text-white transition-colors">Encontrar Profissionais</Link></li>
                            <li><Link to="/empresa/cadastro" className="hover:text-white transition-colors">Cadastrar Empresa</Link></li>
                            <li><Link to="/planos" className="hover:text-white transition-colors">Planos e Preços</Link></li>
                            <li><Link to="/app" className="hover:text-white transition-colors">Baixar App</Link></li>
                        </ul>
                    </div>

                    {/* Institutional */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Institucional</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li><Link to="/sobre" className="hover:text-white transition-colors">Sobre a CONTRATTO</Link></li>
                            <li><Link to="/carreiras" className="hover:text-white transition-colors">Carreiras</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link to="/imprensa" className="hover:text-white transition-colors">Imprensa</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-bold text-lg mb-6">Contato</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li>suporte@tgtcontratto.com.br</li>
                            <li>+55 (45) 99999-9999</li>
                            <li>Cascavel, PR</li>
                        </ul>
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Liderança</p>
                            <p className="text-xs text-gray-400">Matheus (CEO) • Eduardo Bombonatto • Lucas Maciel</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>© 2026 CONTRATTO. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <Link to="/privacidade" className="hover:text-white">Privacidade</Link>
                        <Link to="/termos" className="hover:text-white">Termos de Uso</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
