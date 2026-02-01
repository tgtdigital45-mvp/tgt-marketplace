import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

const PlansPage: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen py-24">
            <Helmet>
                <title>Planos e Preços | TGT Contratto</title>
                <meta name="description" content="Escolha o plano ideal para destacar sua empresa e conseguir mais clientes no TGT Contratto." />
            </Helmet>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
                        Acelere o crescimento do seu negócio
                    </h1>
                    <p className="mt-4 text-xl text-gray-600">
                        Escolha a melhor opção para aumentar sua visibilidade e fechar mais contratos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Grátis */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col hover:shadow-lg transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Básico</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold text-gray-900">Grátis</span>
                                <span className="ml-1 text-gray-500">/sempre</span>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm">Para quem está começando a divulgar serviços.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">Perfil Básico da Empresa</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">1 Categoria de Serviço</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">Receba contatos ilimitados</span>
                            </li>
                            <li className="flex items-start opacity-50">
                                <X className="h-5 w-5 text-gray-300 shrink-0 mr-2" />
                                <span className="text-gray-400">Selo de Verificado</span>
                            </li>
                            <li className="flex items-start opacity-50">
                                <X className="h-5 w-5 text-gray-300 shrink-0 mr-2" />
                                <span className="text-gray-400">Destaque nas buscas</span>
                            </li>
                        </ul>
                        <Link to="/empresa/cadastro" className="w-full">
                            <Button variant="outline" className="w-full">Começar Grátis</Button>
                        </Link>
                    </div>

                    {/* Pro */}
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-brand-primary p-8 flex flex-col relative transform scale-105 z-10">
                        <div className="absolute top-0 right-0 -mt-4 mr-4">
                            <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                Mais Popular
                            </span>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-brand-primary">Profissional</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold text-gray-900">R$ 59</span>
                                <span className="ml-1 text-gray-500">/mês</span>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm">Para quem quer crescer e transmitir confiança.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-brand-primary shrink-0 mr-2" />
                                <span className="text-gray-900 font-medium">Tudo do Básico</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-brand-primary shrink-0 mr-2" />
                                <span className="text-gray-900 font-medium">Selo de Verificado</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-brand-primary shrink-0 mr-2" />
                                <span className="text-gray-900 font-medium">Até 3 Categorias</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-brand-primary shrink-0 mr-2" />
                                <span className="text-gray-900 font-medium">Destaque nos resultados</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-brand-primary shrink-0 mr-2" />
                                <span className="text-gray-900 font-medium">Galeria de Fotos Ilimitada</span>
                            </li>
                        </ul>
                        <Link to="/empresa/cadastro" className="w-full">
                            <Button variant="primary" className="w-full h-12 text-lg shadow-lg shadow-brand-primary/30">
                                Assinar Pro
                            </Button>
                        </Link>
                    </div>

                    {/* Enterprise */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col hover:shadow-lg transition-shadow duration-300">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold text-gray-900">Sob Consulta</span>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm">Para grandes redes e franquias.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">Gestão Multi-unidades</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">API de Integração</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">Gerente de Conta Dedicado</span>
                            </li>
                            <li className="flex items-start">
                                <Check className="h-5 w-5 text-green-500 shrink-0 mr-2" />
                                <span className="text-gray-600">Relatórios Personalizados</span>
                            </li>
                        </ul>
                        <Link to="/contato" className="w-full">
                            <Button variant="outline" className="w-full">Falar com Consultor</Button>
                        </Link>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-500">
                        Dúvidas sobre os planos? <Link to="/ajuda" className="text-brand-primary hover:underline">Visite nossa Central de Ajuda</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
