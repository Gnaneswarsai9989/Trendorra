import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleAuthSuccess() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = decodeURIComponent(params.get('token') || '');
    if (token) {
      loginWithToken(token).then((res) => {
        if (res.success) {
          navigate('/', { replace: true });
        } else {
          navigate('/login?error=google_failed', { replace: true });
        }
      });
    } else {
      navigate('/login?error=google_failed', { replace: true });
    }
  }, []);

  return (
    <div style={{
      backgroundColor: '#111111',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(201,168,76,0.2)',
        borderTop: '3px solid #C9A84C',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{
        color: '#C9A84C',
        fontSize: '13px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        fontFamily: 'Jost, sans-serif'
      }}>
        Signing you in...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}