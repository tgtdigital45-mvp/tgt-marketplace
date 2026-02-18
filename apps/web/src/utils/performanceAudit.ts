/**
 * Performance Audit System (DEV only)
 * Monitora lazy loading, prefetch e CLS automaticamente
 */

// Tipos para os logs
interface PerformanceLog {
    type: 'lazy-load' | 'prefetch' | 'cls';
    component?: string;
    route?: string;
    value?: number;
    timestamp: number;
}

class PerformanceAuditor {
    private logs: PerformanceLog[] = [];
    private clsObserver: PerformanceObserver | null = null;

    constructor() {
        if (process.env.NODE_ENV === 'development') {
            this.initCLSObserver();
            this.startLogging();
        }
    }

    /**
     * Monitora CLS (Cumulative Layout Shift) via PerformanceObserver API
     */
    private initCLSObserver() {
        try {
            this.clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if ((entry as any).hadRecentInput) continue; // Ignorar shifts causados por input do usuário

                    const clsValue = (entry as any).value;
                    if (clsValue > 0) {
                        this.log({
                            type: 'cls',
                            value: clsValue,
                            timestamp: Date.now(),
                        });
                    }
                }
            });

            this.clsObserver.observe({ type: 'layout-shift', buffered: true });
        } catch (error) {
            console.warn('[Performance Audit] CLS Observer not supported:', error);
        }
    }

    /**
     * Registra log de performance
     */
    log(entry: PerformanceLog) {
        this.logs.push(entry);
    }

    /**
     * Exibe relatório de performance no console
     */
    private startLogging() {
        // Log inicial após 5s (tempo para app carregar)
        setTimeout(() => {
            this.printReport();
        }, 5000);

        // Log a cada 30s
        setInterval(() => {
            this.printReport();
        }, 30000);
    }

    /**
     * Imprime relatório formatado no console
     */
    printReport() {
        if (this.logs.length === 0) return;

        console.group('🚀 Performance Audit');

        // Lazy Loading
        const lazyLoads = this.logs.filter(l => l.type === 'lazy-load');
        console.group(`📦 Lazy Loading (${lazyLoads.length} components)`);
        lazyLoads.forEach(log => {
            console.log(`✅ ${log.component} loaded`);
        });
        console.groupEnd();

        // Prefetch
        const prefetches = this.logs.filter(l => l.type === 'prefetch');
        console.group(`⚡ Prefetch (${prefetches.length} routes)`);
        prefetches.forEach(log => {
            console.log(`✅ ${log.route} prefetched`);
        });
        console.groupEnd();

        // CLS
        const clsLogs = this.logs.filter(l => l.type === 'cls');
        const totalCLS = clsLogs.reduce((sum, log) => sum + (log.value || 0), 0);
        const clsStatus = totalCLS < 0.1 ? '✅ Good' : totalCLS < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor';

        console.group(`📊 CLS Score: ${totalCLS.toFixed(4)} ${clsStatus}`);
        if (clsLogs.length > 0) {
            console.log(`Total shifts: ${clsLogs.length}`);
            console.log(`Target: < 0.1 (Good), < 0.25 (Needs Improvement)`);
        } else {
            console.log('No layout shifts detected! 🎉');
        }
        console.groupEnd();

        // Métricas gerais
        console.group('📈 Summary');
        console.log(`Total events: ${this.logs.length}`);
        console.log(`Lazy loads: ${lazyLoads.length}`);
        console.log(`Prefetches: ${prefetches.length}`);
        console.log(`CLS events: ${clsLogs.length}`);
        console.groupEnd();

        console.groupEnd();
    }

    /**
     * Limpa logs
     */
    clear() {
        this.logs = [];
    }

    /**
     * Para observadores
     */
    destroy() {
        if (this.clsObserver) {
            this.clsObserver.disconnect();
        }
    }
}

// Singleton instance
export const performanceAuditor = new PerformanceAuditor();

// Helper functions para uso em componentes
export const logLazyLoad = (component: string) => {
    if (process.env.NODE_ENV === 'development') {
        performanceAuditor.log({
            type: 'lazy-load',
            component,
            timestamp: Date.now(),
        });
        console.log(`[Lazy Load] ${component}`);
    }
};

export const logPrefetch = (route: string) => {
    if (process.env.NODE_ENV === 'development') {
        performanceAuditor.log({
            type: 'prefetch',
            route,
            timestamp: Date.now(),
        });
    }
};
