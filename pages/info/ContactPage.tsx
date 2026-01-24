import React from 'react';
import InfoPageLayout from '../../components/layout/InfoPageLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ContactPage: React.FC = () => {
  return (
    <InfoPageLayout
      title="Fale Conosco"
      subtitle="Tem alguma dúvida, sugestão ou feedback? Adoraríamos ouvir de você."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Contact Info Column */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Canais de Atendimento</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Suporte Geral</h3>
              <p className="text-gray-600 text-sm mb-3">Para dúvidas sobre cadastro, conta ou funcionalidades.</p>
              <a href="mailto:suporte@tgt.com" className="text-brand-primary font-medium hover:underline">suporte@tgt.com</a>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Comercial</h3>
              <p className="text-gray-600 text-sm mb-3">Para parcerias, imprensa e grandes contas.</p>
              <a href="mailto:comercial@tgt.com" className="text-brand-primary font-medium hover:underline">comercial@tgt.com</a>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-2">Telefone & WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-3">Seg a Sex, das 9h às 18h.</p>
              <p className="text-gray-900 font-medium">+55 (11) 4002-8922</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-gray-900 mb-2">Endereço</h3>
            <p className="text-gray-600">Rua da Inovação, 567, Vila Digital<br />São Paulo - SP</p>
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Envie uma mensagem</h2>
          <form className="space-y-6">
            <Input label="Seu Nome" id="name" placeholder="Ex: João Silva" required className="bg-gray-50 border-gray-200" />
            <Input label="Seu Email" id="email" type="email" placeholder="Ex: joao@email.com" required className="bg-gray-50 border-gray-200" />
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Sua Mensagem</label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all resize-none"
                placeholder="Como podemos ajudar?"
                required
              ></textarea>
            </div>
            <Button type="submit" size="lg" className="w-full">Enviar Mensagem</Button>
          </form>
        </div>
      </div>
    </InfoPageLayout>
  );
};

export default ContactPage;
