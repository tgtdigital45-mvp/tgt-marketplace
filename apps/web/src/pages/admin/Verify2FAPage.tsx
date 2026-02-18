import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

const Verify2FAPage = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [factorId, setFactorId] = useState<string | null>(null);

    useEffect(() => {
        const loadFactor = async () => {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) {
                console.error(error);
                return;
            }
            const totp = data.totp.find(f => f.status === 'verified');
            if (!totp) {
                // Should not be here if no factor enabled
                navigate('/admin');
            } else {
                setFactorId(totp.id);
            }
        };
        loadFactor();
    }, [navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!factorId) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code,
            });

            if (error) throw error;

            navigate('/admin');
        } catch (err: any) {
            setError('Código inválido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Verificação de Segurança</h1>
                    <p className="text-gray-500 mt-2">Digite o código de 6 dígitos do seu aplicativo autenticador.</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000 000"
                            className="w-full text-center text-3xl tracking-[0.5em] font-mono p-4 border rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" variant="primary" className="w-full py-3 text-lg" isLoading={loading} disabled={code.length !== 6}>
                        Verificar
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 underline">
                        Sair e tentar outro login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verify2FAPage;
