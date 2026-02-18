import React, { useState, useEffect } from 'react';
import { supabase } from '@tgt/shared';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import QRCode from 'qrcode';
import { useNavigate } from 'react-router-dom';

const AdminSecurityPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [factorId, setFactorId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [existingFactor, setExistingFactor] = useState<any>(null);

    // Check if user already has MFA
    useEffect(() => {
        const checkMFA = async () => {
            const { data, error } = await supabase.auth.mfa.listFactors();
            if (error) {
                console.error('Error listing factors:', error);
                return;
            }

            const totpFactor = data.totp.find(f => f.status === 'verified');
            if (totpFactor) {
                setExistingFactor(totpFactor);
            }
        };
        checkMFA();
    }, []);

    const startEnrollment = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({
                factorType: 'totp',
            });

            if (error) throw error;

            setFactorId(data.id);
            setQrCodeUrl(data.totp.qr_code);
            // Note: supabase returns an SVG string or similar? 
            // Actually supabase js returns a qr_code field which is the authenticator URI.
            // We need to convert that URI to an image using 'qrcode' lib.

            const qrImageUrl = await QRCode.toDataURL(data.totp.uri);
            setQrCodeUrl(qrImageUrl);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!factorId) return;
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.mfa.challengeAndVerify({
                factorId,
                code: verifyCode,
            });

            if (error) throw error;

            setSuccess(true);
            setExistingFactor({ id: factorId }); // Mock update
            setTimeout(() => navigate('/admin'), 2000); // Redirect back to dashboard

        } catch (err: any) {
            console.error(err);
            setError('Código inválido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleUnenroll = async () => {
        if (!existingFactor) return;
        if (!window.confirm("Tem certeza que deseja remover a autenticação de dois fatores? Isso tornará sua conta menos segura.")) return;

        setLoading(true);
        try {
            const { error } = await supabase.auth.mfa.unenroll({
                factorId: existingFactor.id
            });
            if (error) throw error;
            setExistingFactor(null);
            setSuccess(false);
            setQrCodeUrl(null);
            setFactorId(null);
            alert("2FA removido com sucesso.");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="bg-white rounded-[var(--radius-box)] shadow-lg p-8 border border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Segurança da Conta (2FA)</h1>

                {existingFactor ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h2 className="text-xl font-bold text-green-800 mb-2">Autenticação de Dois Fatores Ativa</h2>
                        <p className="text-gray-600 mb-6">Sua conta está protegida. O login requer um código do seu aplicativo autenticador.</p>

                        <Button variant="outline" onClick={handleUnenroll} isLoading={loading} className="text-red-600 border-red-200 hover:bg-red-50">
                            Desativar 2FA
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <p className="text-gray-600">
                            Adicione uma camada extra de segurança à sua conta de administrador ativando a autenticação de dois fatores (MFA).
                        </p>

                        {!qrCodeUrl ? (
                            <Button onClick={startEnrollment} isLoading={loading}>
                                Configurar 2FA Agora
                            </Button>
                        ) : (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-gray-50 p-6 rounded-xl text-center">
                                    <p className="text-sm font-semibold text-gray-700 mb-4">1. Escaneie este QR Code com seu app (Google Authenticator, Authy, etc)</p>
                                    <img src={qrCodeUrl} alt="QR Code 2FA" className="mx-auto border-4 border-white shadow-sm rounded-lg" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">2. Digite o código de 6 dígitos</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={verifyCode}
                                            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg text-center text-xl tracking-widest font-mono focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none"
                                        />
                                        <Button onClick={handleVerify} isLoading={loading} disabled={verifyCode.length !== 6}>
                                            Verificar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-100 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        2FA configurado com sucesso! Redirecionando...
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSecurityPage;
