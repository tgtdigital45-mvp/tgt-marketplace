import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AnimatedSectionProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    distance?: number;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({
    children,
    delay = 0,
    direction = 'up',
    distance = 24,
    className = '',
    ...props
}) => {
    const directionMap = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { x: distance, y: 0 },
        right: { x: -distance, y: 0 },
        none: { x: 0, y: 0 },
    };

    const offset = directionMap[direction];

    return (
        <motion.div
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{
                type: 'spring',
                stiffness: 80,
                damping: 18,
                delay,
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedSection;
