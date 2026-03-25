import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const ReactMarkdown = lazy(() => import('react-markdown'));

interface LazyMarkdownProps {
    content: string;
    className?: string;
}

const LazyMarkdown: React.FC<LazyMarkdownProps> = ({ content, className }) => {
    const [shouldLoad, setShouldLoad] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setShouldLoad(true);
                        observer.disconnect();
                    }
                });
            },
            { rootMargin: '300px' }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className={className}>
            {shouldLoad ? (
                <Suspense fallback={<MarkdownSkeleton />}>
                    <MarkdownWithPlugins content={content} />
                </Suspense>
            ) : (
                <MarkdownSkeleton />
            )}
        </div>
    );
};

const MarkdownWithPlugins: React.FC<{ content: string }> = ({ content }) => {
    const [plugin, setPlugin] = useState<any>(null);

    useEffect(() => {
        import('remark-gfm').then((mod) => {
            setPlugin(() => mod.default);
        });
    }, []);

    if (!plugin) return <MarkdownSkeleton />;

    return (
        <ReactMarkdown remarkPlugins={[plugin]}>
            {content}
        </ReactMarkdown>
    );
};

const MarkdownSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-[90%]" />
        <LoadingSkeleton className="h-4 w-[95%]" />
        <LoadingSkeleton className="h-4 w-[85%]" />
    </div>
);

export default LazyMarkdown;
