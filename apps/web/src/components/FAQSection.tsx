import React from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    faqs: FAQItem[];
    companyName?: string;
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs, companyName }) => {
    const [openIndex, setOpenIndex] = React.useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section id="faq" className="bg-gray-50 p-6 rounded-lg border" itemScope itemType="https://schema.org/FAQPage">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Perguntas Frequentes</h2>

            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                        itemScope
                        itemProp="mainEntity"
                        itemType="https://schema.org/Question"
                    >
                        <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                            <h3 className="font-semibold text-gray-900 pr-4" itemProp="name">
                                {faq.question}
                            </h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {openIndex === index && (
                            <div
                                className="px-4 pb-3 text-gray-600 leading-relaxed"
                                itemScope
                                itemProp="acceptedAnswer"
                                itemType="https://schema.org/Answer"
                            >
                                <p itemProp="text">{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {companyName && (
                <p className="mt-4 text-sm text-gray-500">
                    Tem mais dúvidas sobre {companyName}? Entre em contato conosco!
                </p>
            )}
        </section>
    );
};

export default FAQSection;
