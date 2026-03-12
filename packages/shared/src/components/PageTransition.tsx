import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(3px)' }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
