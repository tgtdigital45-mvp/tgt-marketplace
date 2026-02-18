import React, { useEffect } from 'react';
import { ToastMessage } from '@/contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToastProps {
    toast: ToastMessage;
    removeToast: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, removeToast }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 5000);

        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const bgColors = {
        success: 'bg-white border-green-500',
        error: 'bg-white border-red-500',
        info: 'bg-white border-blue-500'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`flex items-center w-full max-w-sm p-4 text-gray-900 bg-white rounded-[var(--radius-box)] shadow dark:bg-gray-800 dark:text-gray-300 border-l-4 ${bgColors[toast.type]}`}
            role="alert"
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-[var(--radius-box)] bg-gray-100 dark:bg-gray-700">
                {icons[toast.type]}
                <span className="sr-only">{toast.type} icon</span>
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-[var(--radius-box)] focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => removeToast(toast.id)}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <X className="w-3 h-3" />
            </button>
        </motion.div>
    );
};

export default Toast;
