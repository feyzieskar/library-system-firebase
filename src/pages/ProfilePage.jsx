import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBorrows } from '../hooks/useBorrows';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Star, Shield, ArrowLeftRight, Clock, Award } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import styles from './Profile.module.css';

const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ProfilePage() {
    const { user, userData } = useAuth();
    const { borrows, loading } = useBorrows();
    const { t } = useTranslation();

    const userBorrows = useMemo(() => {
        // If Admin/Librarian, we just show their actions or skip it. If member, filter by their text logic or ID.
        // In our system, borrows have `memberName` (and `memberId` eventually).
        // The problem is `member` vs `user`. Members are separate from Auth users in this system's architecture, 
        // but assuming emails match or we just show a general profile for the logged in Admin/Librarian.
        return borrows.filter(b => b.memberName && b.memberName.toLowerCase() === (userData?.displayName || user?.displayName || '').toLowerCase());
    }, [borrows, userData, user]);

    const stats = useMemo(() => {
        let reading = 0;
        let returned = 0;
        let overdue = 0;

        // Fallback if userBorrows is empty (like for admins who don't borrow directly)
        const dataSource = userBorrows.length > 0 ? userBorrows : [];

        dataSource.forEach(b => {
            if (b.status === 'borrowed') reading++;
            if (b.status === 'returned') returned++;
            if (b.status === 'overdue') overdue++;
        });

        return { reading, returned, overdue, total: reading + returned + overdue };
    }, [userBorrows]);

    const badges = useMemo(() => {
        const list = [];
        if (userData?.role === 'admin') {
            list.push({ id: 'admin', icon: <Shield />, name: t('profile.badgeAdmin'), desc: t('profile.badgeAdminDesc'), color: 'var(--accent-500)' });
        }
        if (stats.returned >= 5) {
            list.push({ id: 'bookworm', icon: <Star />, name: t('profile.badgeBookworm'), desc: t('profile.badgeBookwormDesc'), color: 'var(--warning-500)' });
        }
        if (stats.total > 0 && stats.overdue === 0) {
            list.push({ id: 'punctual', icon: <Clock />, name: t('profile.badgePunctual'), desc: t('profile.badgePunctualDesc'), color: 'var(--success-500)' });
        }
        if (list.length === 0) {
            list.push({ id: 'newbie', icon: <Award />, name: t('profile.badgeNewbie'), desc: t('profile.badgeNewbieDesc'), color: 'var(--primary-500)' });
        }
        return list;
    }, [stats, userData]);

    const displayName = userData?.displayName || user?.displayName || user?.email?.split('@')[0] || t('roles.unknown');
    const initial = displayName.charAt(0).toUpperCase();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('common.loading')}</div>;
    }

    return (
        <motion.div variants={containerVariant} initial="hidden" animate="visible">
            <motion.div variants={itemVariant} className={styles.profileHeader}>
                <div className={styles.avatarContainer}>
                    {user?.photoURL ? <img src={user.photoURL} alt="" className={styles.avatarImage} /> : initial}
                </div>
                <div className={styles.userInfo}>
                    <h1>{displayName}</h1>
                    <p>
                        <span className={`badge badge-primary`}>{t(`roles.${userData?.role || 'member'}`)}</span>
                        {user?.email}
                    </p>
                </div>
            </motion.div>

            <div className={styles.grid}>
                <motion.div variants={itemVariant} className="card">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Trophy size={20} color="var(--warning-500)" />
                        {t('profile.badgesTitle')}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {badges.map(b => (
                            <div key={b.id} className={styles.badgeCard} style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius-lg)' }}>
                                <div className={styles.badgeIcon} style={{ background: `linear-gradient(135deg, ${b.color}, var(--gray-800))` }}>
                                    {b.icon}
                                </div>
                                <h3>{b.name}</h3>
                                <p>{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariant} className="card">
                    <h2 style={{ marginBottom: '1.5rem' }}>{t('profile.statsTitle')}</h2>
                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>{t('profile.statTotal')}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ color: 'var(--success-500)' }}>{stats.returned}</span>
                            <span className={styles.statLabel}>{t('profile.statRead')}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ color: 'var(--warning-500)' }}>{stats.reading}</span>
                            <span className={styles.statLabel}>{t('profile.statReading')}</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {(userData?.role === 'member' || userBorrows.length > 0) && (
                <motion.div variants={itemVariant} className="card">
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeftRight size={20} /> {t('profile.recentBorrows')}
                    </h2>
                    {userBorrows.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>{t('profile.noBorrows')}</p>
                    ) : (
                        <div className={styles.historyList}>
                            {userBorrows.slice(0, 5).map(b => (
                                <div key={b.id} className={styles.historyItem}>
                                    <div>
                                        <div className={styles.historyBook}>{b.bookTitle}</div>
                                        <div className={styles.historyDate}>{t('profile.borrowedAt')}{formatDate(b.borrowDate)}</div>
                                    </div>
                                    <span className={`badge ${b.status === 'returned' ? 'badge-success' : b.status === 'overdue' ? 'badge-danger' : 'badge-primary'}`}>
                                        {t(`badges.${b.status}`)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );
}
