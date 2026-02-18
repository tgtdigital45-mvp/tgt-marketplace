import { Variants } from 'framer-motion';

// Padrão de física de mola para todas as animações
export const springTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
};

export const snappySpring = {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
};

// Variantes de entrada (Fade Up)
export const fadeInUp: Variants = {
    hidden: {
        opacity: 0,
        y: 60,
        filter: "blur(10px)"
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            ...springTransition
        }
    }
};

// Variantes de entrada (Fade In Simples)
export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6 }
    }
};

// Variantes para Stagger (Lista de itens)
export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

// Micro-interações
export const hoverScale = {
    scale: 1.05,
    transition: snappySpring
};

export const tapScale = {
    scale: 0.95,
    transition: snappySpring
};
