import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBooks } from '../hooks/useBooks';
import { useMembers } from '../hooks/useMembers';
import { useBorrows } from '../hooks/useBorrows';
import { useReviews } from '../hooks/useReviews';
import ProfilePage from './ProfilePage';
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, TrendingUp, Clock, Star, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate, truncate } from '../utils/helpers';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import styles from './Dashboard.module.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const containerVariant = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
};

export default function DashboardPage() {
    const { books, loading: booksLoading } = useBooks();
    const { members, loading: membersLoading } = useMembers();
    const { borrows, loading: borrowsLoading, getStats } = useBorrows();
    const { getRecentReviews } = useReviews();
    const { getRole, userData } = useAuth();
    const { t } = useTranslation();

    const isMember = getRole() === 'member';

    const popularBooks = (() => {
        const counts = {};
        borrows.forEach(b => {
            counts[b.bookTitle] = (counts[b.bookTitle] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([title, count]) => ({ title, count }));
    })();

    // Member Dashboard
    if (isMember) {
        return (
            <motion.div variants={containerVariant} initial="hidden" animate="visible">
                <motion.div variants={itemVariant} className={styles.header}>
                    <h1>👋 {t('dashboard.welcomeMember', 'Hoş Geldiniz')}, {userData?.displayName || ''}</h1>
                    <p>{t('dashboard.memberSubtitle', 'Kütüphane keşfetmeye hazır mısınız?')}</p>
                </motion.div>

                <div className={styles.bottomGrid}>
                    <motion.div variants={itemVariant} className={`card ${styles.tableCard}`}>
                        <h3><TrendingUp size={18} /> {t('dashboard.popularBooks')}</h3>
                        {popularBooks.length === 0 ? (
                            <p className={styles.empty}>{t('dashboard.noPopular')}</p>
                        ) : (
                            <div className={styles.popularList}>
                                {popularBooks.map((b, i) => (
                                    <div key={i} className={styles.popularItem}>
                                        <span className={styles.rank}>#{i + 1}</span>
                                        <span className={styles.bookTitle}>{b.title}</span>
                                        <span className="badge badge-primary">{b.count}x</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div variants={itemVariant} className={`card ${styles.tableCard}`}>
                        <h3><MessageSquare size={18} /> {t('dashboard.recentReviews', 'Son Yorumlar')}</h3>
                        {getRecentReviews(5).length === 0 ? (
                            <p className={styles.empty}>{t('dashboard.noReviews', 'Henüz yorum yapılmamış.')}</p>
                        ) : (
                            <div className={styles.reviewsList}>
                                {getRecentReviews(5).map(review => (
                                    <div key={review.id} className={styles.reviewItem}>
                                        <div className={styles.reviewTop}>
                                            <div className={styles.reviewUser}>
                                                <div className={styles.reviewAvatar}>
                                                    {review.userPhoto
                                                        ? <img src={review.userPhoto} alt="" />
                                                        : (review.userName?.charAt(0) || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={styles.reviewUserName}>{review.userName}</span>
                                                    <span className={styles.reviewBookName}>{truncate(review.bookTitle, 30)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.reviewStars}>
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <Star
                                                        key={s}
                                                        size={12}
                                                        fill={s <= review.rating ? 'var(--warning-400)' : 'transparent'}
                                                        color={s <= review.rating ? 'var(--warning-400)' : 'var(--gray-400)'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className={styles.reviewText}>{truncate(review.comment, 80)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    const loading = booksLoading || membersLoading || borrowsLoading;
    const stats = getStats();

    const categoryData = (() => {
        const counts = {};
        books.forEach(b => {
            const cat = b.categories || t('dashboard.other', 'Diğer');
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));
    })();

    const ratingData = (() => {
        const buckets = { '0-1': 0, '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
        books.forEach(b => {
            const r = parseFloat(b.average_rating) || 0;
            if (r <= 1) buckets['0-1']++;
            else if (r <= 2) buckets['1-2']++;
            else if (r <= 3) buckets['2-3']++;
            else if (r <= 4) buckets['3-4']++;
            else buckets['4-5']++;
        });
        return Object.entries(buckets).map(([name, value]) => ({ name: name + '★', value }));
    })();

    const recentBorrows = borrows.slice(0, 5);

    if (loading) {
        return (
            <div>
                <div className={styles.header}>
                    <h1>{t('dashboard.title')}</h1>
                    <p>{t('dashboard.subtitle')}</p>
                </div>
                <div className={styles.statsGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`card ${styles.statCard}`}>
                            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                            <div className="skeleton" style={{ width: '60%', height: 20, marginTop: 12 }} />
                            <div className="skeleton" style={{ width: '40%', height: 32, marginTop: 8 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariant} initial="hidden" animate="visible">
            <motion.div variants={itemVariant} className={styles.header}>
                <h1>📊 {t('dashboard.title')}</h1>
                <p>{t('dashboard.subtitle')}</p>
            </motion.div>

            <motion.div variants={itemVariant} className={styles.statsGrid}>
                <StatCard icon={<BookOpen />} label={t('dashboard.totalBooks')} value={books.length} color="blue" />
                <StatCard icon={<Users />} label={t('dashboard.activeMembers')} value={members.filter(m => m.status === 'active').length} color="purple" />
                <StatCard icon={<ArrowLeftRight />} label={t('dashboard.activeBorrows')} value={stats.active} color="green" />
                <StatCard icon={<AlertTriangle />} label={t('dashboard.overdue')} value={stats.overdue} color="red" />
            </motion.div>

            <div className={styles.chartsGrid}>
                <motion.div variants={itemVariant} className={`card ${styles.chartCard}`}>
                    <h3>📚 {t('dashboard.catDist')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" paddingAngle={3}>
                                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(val, name) => [val, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.legend}>
                        {categoryData.map((item, i) => (
                            <span key={i} className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ background: COLORS[i % COLORS.length] }} />
                                {item.name} ({item.value})
                            </span>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariant} className={`card ${styles.chartCard}`}>
                    <h3>⭐ {t('dashboard.ratingDist')}</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={ratingData}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(val) => [val, '']} />
                            <Bar dataKey="value" fill="var(--primary-500)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            <div className={styles.bottomGrid}>
                <motion.div variants={itemVariant} className={`card ${styles.tableCard}`}>
                    <h3><Clock size={18} /> {t('dashboard.recentBorrows')}</h3>
                    {recentBorrows.length === 0 ? (
                        <p className={styles.empty}>{t('dashboard.noBorrows')}</p>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>{t('dashboard.book')}</th>
                                        <th>{t('dashboard.member')}</th>
                                        <th>{t('dashboard.date')}</th>
                                        <th>{t('common.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBorrows.map(b => (
                                        <tr key={b.id}>
                                            <td>{b.bookTitle}</td>
                                            <td>{b.memberName}</td>
                                            <td>{formatDate(b.borrowDate)}</td>
                                            <td>
                                                <span className={`badge ${b.status === 'returned' ? 'badge-success' : b.status === 'overdue' ? 'badge-danger' : 'badge-primary'}`}>
                                                    {t(`badges.${b.status}`)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariant} className={`card ${styles.tableCard}`}>
                    <h3><TrendingUp size={18} /> {t('dashboard.popularBooks')}</h3>
                    {popularBooks.length === 0 ? (
                        <p className={styles.empty}>{t('dashboard.noPopular')}</p>
                    ) : (
                        <div className={styles.popularList}>
                            {popularBooks.map((b, i) => (
                                <div key={i} className={styles.popularItem}>
                                    <span className={styles.rank}>#{i + 1}</span>
                                    <span className={styles.bookTitle}>{b.title}</span>
                                    <span className="badge badge-primary">{b.count}x</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div variants={itemVariant} className={`card ${styles.tableCard}`}>
                    <h3><MessageSquare size={18} /> {t('dashboard.recentReviews', 'Son Yorumlar')}</h3>
                    {getRecentReviews(5).length === 0 ? (
                        <p className={styles.empty}>{t('dashboard.noReviews', 'Henüz yorum yapılmamış.')}</p>
                    ) : (
                        <div className={styles.reviewsList}>
                            {getRecentReviews(5).map(review => (
                                <div key={review.id} className={styles.reviewItem}>
                                    <div className={styles.reviewTop}>
                                        <div className={styles.reviewUser}>
                                            <div className={styles.reviewAvatar}>
                                                {review.userPhoto
                                                    ? <img src={review.userPhoto} alt="" />
                                                    : (review.userName?.charAt(0) || '?').toUpperCase()}
                                            </div>
                                            <div>
                                                <span className={styles.reviewUserName}>{review.userName}</span>
                                                <span className={styles.reviewBookName}>{truncate(review.bookTitle, 30)}</span>
                                            </div>
                                        </div>
                                        <div className={styles.reviewStars}>
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    size={12}
                                                    fill={s <= review.rating ? 'var(--warning-400)' : 'transparent'}
                                                    color={s <= review.rating ? 'var(--warning-400)' : 'var(--gray-400)'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className={styles.reviewText}>{truncate(review.comment, 80)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatCard({ icon, label, value, color }) {
    const colorMap = {
        blue: { bg: 'rgba(59,130,246,0.1)', iconBg: 'linear-gradient(135deg, #3b82f6, #2563eb)', text: '#3b82f6' },
        purple: { bg: 'rgba(139,92,246,0.1)', iconBg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', text: '#8b5cf6' },
        green: { bg: 'rgba(34,197,94,0.1)', iconBg: 'linear-gradient(135deg, #22c55e, #16a34a)', text: '#22c55e' },
        red: { bg: 'rgba(239,68,68,0.1)', iconBg: 'linear-gradient(135deg, #ef4444, #dc2626)', text: '#ef4444' },
    };
    const c = colorMap[color];

    return (
        <div className={`card ${styles.statCard}`} style={{ borderTop: `3px solid ${c.text}` }}>
            <div className={styles.statIcon} style={{ background: c.iconBg }}>
                {icon}
            </div>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue} style={{ color: c.text }}>{value.toLocaleString()}</div>
        </div>
    );
}
