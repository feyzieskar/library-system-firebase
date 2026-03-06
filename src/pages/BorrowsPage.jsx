import { useState, useMemo } from 'react';
import { useBorrows } from '../hooks/useBorrows';
import { useBooks } from '../hooks/useBooks';
import { useMembers } from '../hooks/useMembers';
import { useTranslation } from 'react-i18next';
import { ArrowLeftRight, Search, Plus, Filter, CheckCircle2, Clock, AlertTriangle, X, Download, Mail } from 'lucide-react';
import { formatDate, truncate } from '../utils/helpers';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { motion } from 'framer-motion';
import styles from './Borrows.module.css';

const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function BorrowsPage() {
    const { borrows, loading, borrowBook, returnBook } = useBorrows();
    const { books, searchBooks } = useBooks();
    const { members } = useMembers(); // Sadece aktifleri filtreleyeceğiz modal içinde
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, borrowed, overdue, returned
    const [showModal, setShowModal] = useState(false);

    const filtered = useMemo(() => {
        let result = borrows;
        if (statusFilter !== 'all') {
            result = result.filter(b => b.status === statusFilter);
        }
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(b =>
                b.bookTitle?.toLowerCase().includes(lower) ||
                b.memberName?.toLowerCase().includes(lower)
            );
        }
        return result;
    }, [borrows, search, statusFilter]);

    const handleReturn = async (borrow) => {
        let penaltyMessage = '';
        if (borrow.status === 'overdue' || new Date() > new Date(borrow.dueDate)) {
            const due = new Date(borrow.dueDate).getTime();
            const now = new Date().getTime();
            const diffDays = Math.ceil((now - due) / (1000 * 3600 * 24));
            if (diffDays > 0) {
                const penalty = diffDays * 5; // 5 TL per day
                penaltyMessage = `\n\n⚠️ ${t('borrows.penaltyWarning', 'DİKKAT: Bu kitap {{days}} gün gecikmeli iade ediliyor.', { days: diffDays })}\n${t('borrows.totalPenalty', 'Toplam Ceza')}: ${penalty} ₺`;
            }
        }

        if (window.confirm(t('borrows.errReturnConfirm', { title: borrow.bookTitle }) + penaltyMessage)) {
            await returnBook(borrow.id, borrow.bookId);
        }
    };

    const handleSendReminder = (borrow) => {
        const member = members.find(m => m.id === borrow.memberId);
        if (!member || !member.email) {
            alert(t('borrows.errNoEmail', 'Üyenin kayıtlı e-posta adresi bulunmuyor.'));
            return;
        }

        const subject = encodeURIComponent(t('borrows.reminderSubject', 'Kütüphane: Gecikmiş Kitap İadesi'));
        const body = encodeURIComponent(
            t('borrows.reminderBody', 'Sayın {{name}},\n\nÖdünç almış olduğunuz "{{book}}" adlı kitabın iade tarihi asılmıştır. Lütfen en kısa sürede kütüphaneye iade ediniz.\n\nİyi günler dileriz.', { name: member.fullName, book: borrow.bookTitle })
        );
        window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1>🔄 {t('borrows.title')}</h1>
                    <p>{t('borrows.countMsg', { count: filtered.length })}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'borrows-export', t)}>
                        <Download size={18} /> CSV
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                        const columns = [
                            { header: t('borrows.tableBook', 'Kitap'), dataKey: 'bookTitle' },
                            { header: t('borrows.tableMember', 'Üye'), dataKey: 'memberName' },
                            { header: t('borrows.tableBorrowDate', 'Veriliş'), dataKey: 'borrowDate' },
                            { header: t('borrows.tableDueDate', 'Son İade'), dataKey: 'dueDate' },
                            { header: t('common.status', 'Durum'), dataKey: 'status' }
                        ];
                        exportToPDF(filtered, columns, 'borrows-export', t('nav.borrows', 'Ödünç İşlemleri'), t);
                    }}>
                        <Download size={18} /> PDF
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> {t('borrows.addBtn')}
                    </button>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('borrows.searchPlaceholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
                    />
                </div>

                <div className={styles.statusFilters}>
                    <button className={`btn-icon ${statusFilter === 'all' ? styles.active : ''}`} onClick={() => setStatusFilter('all')}>
                        {t('borrows.filterAll')}
                    </button>
                    <button className={`btn-icon ${statusFilter === 'borrowed' ? styles.active : ''}`} onClick={() => setStatusFilter('borrowed')}>
                        <Clock size={16} /> {t('borrows.filterBorrowed')}
                    </button>
                    <button className={`btn-icon ${statusFilter === 'overdue' ? styles.active : ''}`} onClick={() => setStatusFilter('overdue')}>
                        <AlertTriangle size={16} /> {t('borrows.filterOverdue')}
                    </button>
                    <button className={`btn-icon ${statusFilter === 'returned' ? styles.active : ''}`} onClick={() => setStatusFilter('returned')}>
                        <CheckCircle2 size={16} /> {t('borrows.filterReturned')}
                    </button>
                </div>
            </div>

            <div className="card table-wrapper">
                {loading ? (
                    <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>{t('common.loading')}</div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <ArrowLeftRight size={48} />
                        <h3>{t('borrows.noRecords')}</h3>
                        <p>{t('borrows.noRecordsDesc')}</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>{t('borrows.tableBook')}</th>
                                <th>{t('borrows.tableMember')}</th>
                                <th>{t('borrows.tableBorrowDate')}</th>
                                <th>{t('borrows.tableDueDate')}</th>
                                <th>{t('borrows.tableReturnDate')}</th>
                                <th>{t('common.status')}</th>
                                <th>{t('common.action')}</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariant} initial="hidden" animate="visible">
                            {filtered.map(b => (
                                <motion.tr key={b.id} variants={itemVariant}>
                                    <td style={{ fontWeight: 500 }}>{truncate(b.bookTitle, 40)}</td>
                                    <td>{b.memberName}</td>
                                    <td>{formatDate(b.borrowDate)}</td>
                                    <td style={{ color: b.status === 'overdue' ? 'var(--danger-500)' : 'inherit' }}>
                                        {formatDate(b.dueDate)}
                                    </td>
                                    <td>{b.returnDate ? formatDate(b.returnDate) : '—'}</td>
                                    <td>
                                        <span className={`badge ${b.status === 'returned' ? 'badge-success' : b.status === 'overdue' ? 'badge-danger' : 'badge-primary'}`}>
                                            {t(`badges.${b.status}`)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {b.status !== 'returned' && (
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(b)}>
                                                    {t('borrows.btnReturn')}
                                                </button>
                                            )}
                                            {b.status === 'overdue' && (
                                                <button
                                                    className="btn-icon"
                                                    title={t('borrows.sendReminder', 'Hatırlatma Gönder')}
                                                    onClick={() => handleSendReminder(b)}
                                                >
                                                    <Mail size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <IssueModal
                    onClose={() => setShowModal(false)}
                    onIssue={borrowBook}
                    books={books}
                    searchBooks={searchBooks}
                    members={members}
                    t={t}
                />
            )}
        </div>
    );
}

function IssueModal({ onClose, onIssue, books, searchBooks, members, t }) {
    const [bookQuery, setBookQuery] = useState('');
    const [selectedBook, setSelectedBook] = useState(null);

    const [memberQuery, setMemberQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);

    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14); // Default 14 days
        return d.toISOString().split('T')[0];
    });
    const [saving, setSaving] = useState(false);

    // Filter books on the fly (showing max 5 for dropdown)
    const bookResults = useMemo(() => {
        if (!bookQuery) return [];
        return searchBooks(bookQuery).filter(b => (b.available || 0) > 0).slice(0, 5);
    }, [bookQuery, books]);

    // Filter members on the fly (showing max 5)
    const memberResults = useMemo(() => {
        if (!memberQuery) return [];
        const lower = memberQuery.toLowerCase();
        return members
            .filter(m => m.status === 'active' && (m.fullName.toLowerCase().includes(lower) || m.email?.toLowerCase().includes(lower)))
            .slice(0, 5);
    }, [memberQuery, members]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBook || !selectedMember || !dueDate) return;
        setSaving(true);
        try {
            await onIssue({
                bookId: selectedBook.id,
                bookTitle: selectedBook.title,
                memberId: selectedMember.id,
                memberName: selectedMember.fullName,
                dueDate
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ overflow: 'visible' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">📌 {t('borrows.modalTitle')}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ overflow: 'visible' }}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', overflow: 'visible' }}>

                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">{t('borrows.selectBook')}</label>
                            {selectedBook ? (
                                <div className={styles.selectedItem}>
                                    <span>{selectedBook.title}</span>
                                    <button type="button" onClick={() => setSelectedBook(null)}><X size={14} /></button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        className="form-input"
                                        placeholder={t('borrows.searchBookPlaceholder')}
                                        value={bookQuery}
                                        onChange={e => setBookQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    {bookResults.length > 0 && (
                                        <div className={styles.dropdown}>
                                            {bookResults.map(b => (
                                                <div key={b.id} className={styles.dropdownItem} onClick={() => { setSelectedBook(b); setBookQuery(''); }}>
                                                    <span className="truncate">{b.title}</span>
                                                    <span className="badge badge-success">{t('borrows.available', { count: b.available || 0 })}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">{t('borrows.selectMember')}</label>
                            {selectedMember ? (
                                <div className={styles.selectedItem}>
                                    <span>{selectedMember.fullName} ({selectedMember.email})</span>
                                    <button type="button" onClick={() => setSelectedMember(null)}><X size={14} /></button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        className="form-input"
                                        placeholder={t('borrows.searchMemberPlaceholder')}
                                        value={memberQuery}
                                        onChange={e => setMemberQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    {memberResults.length > 0 && (
                                        <div className={styles.dropdown}>
                                            {memberResults.map(m => (
                                                <div key={m.id} className={styles.dropdownItem} onClick={() => { setSelectedMember(m); setMemberQuery(''); }}>
                                                    <span className="truncate">{m.fullName}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{m.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('borrows.dueDate')}</label>
                            <input
                                type="date"
                                className="form-input"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                required
                            />
                        </div>

                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn btn-primary" disabled={saving || !selectedBook || !selectedMember}>
                            {saving ? t('books.btnSaving') : t('borrows.btnIssue')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
