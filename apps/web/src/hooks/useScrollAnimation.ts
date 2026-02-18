import { useAnimation, useInView, Variants } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { fadeInUp, staggerContainer } from '@/utils/animations';

export type AnimationType = 'fadeInUp' | 'fadeIn' | 'stagger' | 'scaleUp';

interface UseScrollAnimationProps {
    threshold?: number;
    delay?: number;
    type?: AnimationType;
    variants?: Variants;
}

export const useScrollAnimation = ({
    threshold = 0.1,
    delay = 0,
    type = 'fadeInUp',
    variants,
}: UseScrollAnimationProps = {}) => {
    const controls = useAnimation();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: threshold });

    useEffect(() => {
        if (isInView) {
            controls.start('visible');
        }
    }, [controls, isInView]);

    let selectedVariants = variants;

    if (!selectedVariants) {
        switch (type) {
            case 'fadeInUp':
                selectedVariants = fadeInUp;
                break;
            case 'stagger':
                selectedVariants = staggerContainer;
                break;
            default:
                selectedVariants = fadeInUp;
        }
    }

    // Inject delay into variants if needed (simple approximation)
    const finalVariants = {
        ...selectedVariants,
        visible: {
            ...selectedVariants?.visible,
            transition: {
                ...(typeof selectedVariants?.visible === 'object' ? selectedVariants.visible.transition : {}),
                delay: delay,
            },
        },
    };

    return { ref, controls, variants: finalVariants, initial: 'hidden' };
};
