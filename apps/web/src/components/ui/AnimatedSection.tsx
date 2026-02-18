import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedSectionProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    delay?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay = 0, className = '', ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedSection;
