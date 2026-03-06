import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Library } from 'lucide-react';
import styles from './Auth.module.css';

export default function RegisterPage() {
    const { user, register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (user) return <Navigate to="/" replace />;

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            return setError(t('auth.errPasswordMatch'));
        }
        if (form.password.length < 6) {
            return setError(t('auth.errWeakPassword'));
        }

        setLoading(true);
        try {
            await register(form.email, form.password, form.displayName);
            navigate('/');
        } catch (err) {
            setError(getFirebaseError(err.code, t));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        setError('');
        try {
            await loginWithGoogle();
            navigate('/');
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(getFirebaseError(err.code, t));
            }
        }
    };

    return (
        <div className={styles['login-wrapper']}>
            <div className={styles['login-card']}>
                <div className={styles['login-logo']}>
                    <div className={styles.icon}>
                        <Library size={30} color="white" />
                    </div>
                    <h1>{t('auth.registerTitle')}</h1>
                    <p>{t('auth.registerSubtitle')}</p>
                </div>

                {error && <div className={styles['error-message']}>{error}</div>}

                <form className={styles['login-form']} onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">{t('auth.fullName')}</label>
                        <input
                            type="text"
                            name="displayName"
                            className="form-input"
                            placeholder={t('auth.fullName')}
                            value={form.displayName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="ornek@mail.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('auth.passwordConfirm')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
                        {loading ? t('auth.registering') : t('auth.registerBtn')}
                    </button>

                    <div className={styles.divider}>{t('common.or')}</div>

                    <button type="button" className={styles['google-btn']} onClick={handleGoogle}>
                        <svg className={styles['google-icon']} viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {t('auth.googleRegister')}
                    </button>
                </form>

                <div className={styles['auth-switch']}>
                    {t('auth.hasAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
                </div>
            </div>
        </div>
    );
}

function getFirebaseError(code, t) {
    const map = {
        'auth/email-already-in-use': t('auth.errEmailInUse'),
        'auth/invalid-email': t('auth.errInvalidEmail'),
        'auth/weak-password': t('auth.errWeakPassword'),
    };
    return map[code] || t('common.loading'); // fallback
}
