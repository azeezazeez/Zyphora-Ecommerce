import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function OAuthSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { completeGoogleLogin } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) {
            return;
        }

        hasProcessed.current = true;

        const token = searchParams.get('token');

        if (!token) {
            setError('Google sign-in did not return an authentication token.');
            return;
        }

        completeGoogleLogin(token)
            .then(() => {
                navigate('/', { replace: true });
            })
            .catch((err: any) => {
                console.error('Google OAuth completion failed:', err);

                setError(
                    err?.message ||
                    'Google sign-in could not be completed. Please try again.'
                );
            });
    }, [searchParams, completeGoogleLogin, navigate]);

    if (error) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    background: '#f8fafc',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '420px',
                        padding: '32px',
                        borderRadius: '16px',
                        background: '#ffffff',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                        textAlign: 'center',
                    }}
                >
                    <h2
                        style={{
                            marginBottom: '12px',
                            color: '#111827',
                        }}
                    >
                        Google Sign-In Failed
                    </h2>

                    <p
                        style={{
                            marginBottom: '24px',
                            color: '#6b7280',
                            lineHeight: 1.6,
                        }}
                    >
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/', { replace: true })}
                        style={{
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 20px',
                            background: '#2563eb',
                            color: '#ffffff',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Back to Zyphora
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
            }}
        >
            <div
                style={{
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        width: '42px',
                        height: '42px',
                        margin: '0 auto 20px',
                        border: '4px solid #e5e7eb',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        animation: 'oauth-spin 0.8s linear infinite',
                    }}
                />

                <h2
                    style={{
                        marginBottom: '8px',
                        color: '#111827',
                    }}
                >
                    Signing you in...
                </h2>

                <p
                    style={{
                        color: '#6b7280',
                    }}
                >
                    Please wait while we complete your Google sign-in.
                </p>

                <style>
                    {`
            @keyframes oauth-spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}
                </style>
            </div>
        </div>
    );
}