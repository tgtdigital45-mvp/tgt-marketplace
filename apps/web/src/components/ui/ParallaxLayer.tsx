import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxLayerProps {
    children: React.ReactNode;
    offset?: number;
    className?: string;
}

const ParallaxLayer: React.FC<ParallaxLayerProps> = ({ children, offset = 50, className = '' }) => {
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 500], [0, offset]);

    return (
        <motion.div style={{ y }} className={className}>
            {children}
        </motion.div>
    );
};

export default ParallaxLayer;
