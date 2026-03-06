import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getRoleLabel } from '../../utils/helpers';
import { LayoutDashboard, BookOpen, Users, ArrowLeftRight, LogOut, Moon, Sun, Menu, X, Library, Globe, User, FlaskConical, RotateCcw } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
    const { user, userData, logout, canManage, isTester, simulatedRole, switchRole, resetRole, getRole } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const closeMobile = () => setMobileOpen(false);

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'tr' ? 'en' : 'tr');
    };

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
        { to: '/books', icon: <BookOpen size={20} />, label: t('nav.books') },
        ...(canManage() ? [{ to: '/members', icon: <Users size={20} />, label: t('nav.members') }] : []),
        { to: '/borrows', icon: <ArrowLeftRight size={20} />, label: t('nav.borrows') },
        { to: '/profile', icon: <User size={20} />, label: t('nav.profile', 'Profil') },
    ];

    const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || t('roles.unknown');
    const initial = displayName.charAt(0).toUpperCase();

    const ROLE_OPTIONS = [
        { value: 'admin', label: t('roles.admin'), emoji: '👑' },
        { value: 'librarian', label: t('roles.librarian'), emoji: '📚' },
        { value: 'member', label: t('roles.member'), emoji: '👤' },
    ];

    return (
        <>
            <button className={styles['mobile-toggle']} onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className={`${styles['sidebar-overlay']} ${mobileOpen ? styles.active : ''}`} onClick={closeMobile} />

            <aside className={`${styles.sidebar} ${mobileOpen ? styles.open : ''}`}>
                <div className={styles['sidebar-brand']}>
                    <div className={styles['brand-icon']}><Library size={22} color="white" /></div>
                    <div className={styles['brand-text']}>
                        <h2>{t('nav.systemTitle')}</h2>
                        <span>{t('nav.systemSubtitle')}</span>
                    </div>
                </div>

                <nav className={styles['sidebar-nav']}>
                    <div className={styles['nav-section-title']}>{t('nav.mainMenu')}</div>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.active : ''}`}
                            onClick={closeMobile}
                        >
                            <span className={styles['nav-icon']}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}

                    <div className={styles['nav-section-title']}>{t('nav.settings')}</div>
                    <button className={styles['nav-item']} onClick={toggleTheme} style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}>
                        <span className={styles['nav-icon']}>
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </span>
                        {theme === 'light' ? t('common.darkTheme') : t('common.lightTheme')}
                    </button>

                    <button className={styles['nav-item']} onClick={toggleLanguage} style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}>
                        <span className={styles['nav-icon']}>
                            <Globe size={20} />
                        </span>
                        {i18n.language === 'tr' ? 'English' : 'Türkçe'}
                    </button>
                </nav>

                {/* Tester Role Switcher */}
                {isTester() && (
                    <div className={styles['tester-panel']}>
                        <div className={styles['tester-header']}>
                            <FlaskConical size={16} />
                            <span>{t('tester.title', '🧪 Test Modu')}</span>
                        </div>
                        {simulatedRole && (
                            <div className={styles['tester-active']}>
                                {t('tester.simulatingAs', 'Simülasyon')}: <strong>{t(`roles.${simulatedRole}`)}</strong>
                            </div>
                        )}
                        <div className={styles['tester-roles']}>
                            {ROLE_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`${styles['tester-role-btn']} ${getRole() === opt.value ? styles['tester-role-active'] : ''}`}
                                    onClick={() => switchRole(opt.value)}
                                >
                                    <span>{opt.emoji}</span>
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        {simulatedRole && (
                            <button className={styles['tester-reset']} onClick={resetRole}>
                                <RotateCcw size={14} />
                                {t('tester.resetRole', 'Sıfırla')}
                            </button>
                        )}
                    </div>
                )}

                <div className={styles['sidebar-footer']}>
                    <div className={styles['user-info']}>
                        <div className={styles['user-avatar']}>
                            {user?.photoURL ? <img src={user.photoURL} alt="" /> : initial}
                        </div>
                        <div className={styles['user-details']}>
                            <div className="name">{displayName}</div>
                            <div className="role">{t(`roles.${userData?.role || 'member'}`)}</div>
                        </div>
                    </div>
                    <button className={styles['logout-btn']} onClick={handleLogout}>
                        <LogOut size={16} /> {t('nav.logout')}
                    </button>
                </div>
            </aside>
        </>
    );
}
