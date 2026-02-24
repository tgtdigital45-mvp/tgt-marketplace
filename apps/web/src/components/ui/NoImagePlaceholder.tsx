import React from 'react';
import { Image } from 'lucide-react';

interface NoImagePlaceholderProps {
    className?: string;
    text?: string;
}

const NoImagePlaceholder: React.FC<NoImagePlaceholderProps> = ({
    className = "aspect-square w-full",
    text = "Imagem não disponível"
}) => {
    return (
        <div className={`bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 border border-gray-200 ${className}`}>
            <Image className="w-8 h-8 opacity-20" />
            <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">{text}</span>
        </div>
    );
};

export default NoImagePlaceholder;
