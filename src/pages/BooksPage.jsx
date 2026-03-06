import { useState, useMemo } from 'react';
import { useBooks } from '../hooks/useBooks';
import { useAuth } from '../contexts/AuthContext';
import { useReviews } from '../hooks/useReviews';
import { useTranslation } from 'react-i18next';
import { Search, Grid3X3, List, Plus, Star, BookOpen, Filter, X, Edit, Trash2, Eye, ScanBarcode, Download, MessageSquare, Send } from 'lucide-react';
import { truncate, debounce, formatDate } from '../utils/helpers';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { motion } from 'framer-motion';
import ScannerModal from '../components/common/ScannerModal';
import styles from './Books.module.css';

const ITEMS_PER_PAGE = 24;

const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function BooksPage() {
    const { books, loading, searchBooks, categories, addBook, updateBook, deleteBook } = useBooks();
    const { canManage } = useAuth();
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const filtered = useMemo(() => searchBooks(search, category), [search, category, books]);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleSearch = debounce((val) => {
        setSearch(val);
        setPage(1);
    }, 300);

    const openDetail = (book) => { setSelectedBook(book); setShowModal('detail'); };
    const openEdit = (book) => { setSelectedBook(book); setShowModal('edit'); };
    const openAdd = () => { setSelectedBook(null); setShowModal('add'); };
    const closeModal = () => { setShowModal(null); setSelectedBook(null); };

    const handleDelete = async (book) => {
        if (window.confirm(t('books.errDeleteConfirm', { title: book.title }))) {
            await deleteBook(book.id);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1>📚 {t('books.title')}</h1>
                    <p>{t('books.foundMsg', { count: filtered.length.toLocaleString() })}</p>
                </div>
                {canManage() && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'books-export', t)}>
                            <Download size={18} /> CSV
                        </button>
                        <button className="btn btn-secondary" onClick={() => {
                            const columns = [
                                { header: t('books.tableBook'), dataKey: 'title' },
                                { header: t('books.tableAuthor'), dataKey: 'authors' },
                                { header: t('books.tableCategory'), dataKey: 'categories' },
                                { header: t('books.tableYear'), dataKey: 'published_year' }
                            ];
                            exportToPDF(filtered, columns, 'books-export', t('nav.books'), t);
                        }}>
                            <Download size={18} /> PDF
                        </button>
                        <button className="btn btn-primary" onClick={openAdd}>
                            <Plus size={18} /> {t('books.addBtn')}
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox} style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '400px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('books.searchPlaceholder')}
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                        />
                    </div>
                    <button
                        className="btn btn-secondary"
                        title={t('books.scanBarcode', 'Barkod Tarat')}
                        onClick={() => setShowScanner(true)}
                        style={{ padding: '0 0.75rem' }}
                    >
                        <ScanBarcode size={20} color="var(--primary-500)" />
                    </button>
                </div>

                <select className="form-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                    <option value="">{t('books.allCategories')}</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className={styles.viewToggle}>
                    <button className={`btn-icon ${viewMode === 'grid' ? styles.active : ''}`} onClick={() => setViewMode('grid')}>
                        <Grid3X3 size={18} />
                    </button>
                    <button className={`btn-icon ${viewMode === 'list' ? styles.active : ''}`} onClick={() => setViewMode('list')}>
                        <List size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className={styles.grid}>
                    {[...Array(12)].map((_, i) => <BookSkeleton key={i} />)}
                </div>
            ) : paginated.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} />
                    <h3>{t('books.noBooksTitle')}</h3>
                    <p>{t('books.noBooksDesc')}</p>
                </div>
            ) : viewMode === 'grid' ? (
                <motion.div className={styles.grid} variants={containerVariant} initial="hidden" animate="visible">
                    {paginated.map(book => (
                        <motion.div key={book.id} variants={itemVariant}>
                            <BookCard book={book} onDetail={openDetail} onEdit={openEdit} onDelete={handleDelete} canManage={canManage()} t={t} />
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>{t('books.tableBook')}</th>
                                <th>{t('books.tableAuthor')}</th>
                                <th>{t('books.tableCategory')}</th>
                                <th>{t('books.tableYear')}</th>
                                <th>{t('books.tableRating')}</th>
                                <th>{t('common.action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(book => (
                                <tr key={book.id}>
                                    <td style={{ fontWeight: 600 }}>{truncate(book.title, 50)}</td>
                                    <td>{book.authors}</td>
                                    <td><span className="badge badge-primary">{book.categories || '—'}</span></td>
                                    <td>{book.published_year || '—'}</td>
                                    <td>{'⭐'} {book.average_rating || '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon" onClick={() => openDetail(book)}><Eye size={16} /></button>
                                            {canManage() && <>
                                                <button className="btn-icon" onClick={() => openEdit(book)}><Edit size={16} /></button>
                                                <button className="btn-icon" style={{ color: 'var(--danger-500)' }} onClick={() => handleDelete(book)}><Trash2 size={16} /></button>
                                            </>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 7) pageNum = i + 1;
                        else if (page <= 4) pageNum = i + 1;
                        else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                        else pageNum = page - 3 + i;
                        return (
                            <button key={pageNum} className={page === pageNum ? 'active' : ''} onClick={() => setPage(pageNum)}>
                                {pageNum}
                            </button>
                        );
                    })}
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                </div>
            )}

            {/* Modals */}
            {showModal === 'detail' && selectedBook && (
                <BookDetailModal book={selectedBook} onClose={closeModal} t={t} />
            )}
            {(showModal === 'add' || showModal === 'edit') && (
                <BookFormModal
                    book={showModal === 'edit' ? selectedBook : null}
                    onSave={async (data) => {
                        if (showModal === 'edit') await updateBook(selectedBook.id, data);
                        else await addBook(data);
                        closeModal();
                    }}
                    onClose={closeModal}
                    t={t}
                />
            )}

            {showScanner && (
                <ScannerModal
                    onClose={() => setShowScanner(false)}
                    onScan={(code) => {
                        setSearch(code);
                        setPage(1);
                    }}
                    t={t}
                />
            )}
        </div>
    );
}

function BookCard({ book, onDetail, onEdit, onDelete, canManage, t }) {
    return (
        <div className={styles.bookCard} onClick={() => onDetail(book)}>
            <div className={styles.bookCover}>
                {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} loading="lazy" />
                ) : (
                    <div className={styles.noCover}><BookOpen size={32} /></div>
                )}
            </div>
            <div className={styles.bookInfo}>
                <h3 className={styles.bookTitle}>{truncate(book.title, 60)}</h3>
                <p className={styles.bookAuthor}>{book.authors || t('books.unknownAuthor', 'Unknown Author')}</p>
                <div className={styles.bookMeta}>
                    {book.average_rating > 0 && (
                        <span className={styles.rating}>
                            <Star size={14} fill="var(--warning-400)" color="var(--warning-400)" />
                            {parseFloat(book.average_rating).toFixed(1)}
                        </span>
                    )}
                    {book.published_year && <span className={styles.year}>{book.published_year}</span>}
                </div>
                {book.categories && <span className="badge badge-primary" style={{ marginTop: 6, fontSize: '0.65rem' }}>{book.categories}</span>}
            </div>
            {canManage && (
                <div className={styles.bookActions} onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" onClick={() => onEdit(book)}><Edit size={14} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger-500)' }} onClick={() => onDelete(book)}><Trash2 size={14} /></button>
                </div>
            )}
        </div>
    );
}

function BookSkeleton() {
    return (
        <div className={styles.bookCard}>
            <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
            <div style={{ padding: 'var(--space-3)' }}>
                <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '80%' }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
            </div>
        </div>
    );
}

function BookDetailModal({ book, onClose, t }) {
    const { user, userData } = useAuth();
    const { reserveBook } = useBooks();
    const { getBookReviews, addReview, deleteReview } = useReviews();
    const [reserving, setReserving] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewHover, setReviewHover] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const handleReserve = async () => {
        if (!user) return;
        setReserving(true);
        try {
            await reserveBook(book.id, { uid: user.uid, displayName: userData?.displayName, email: user.email });
        } finally {
            setReserving(false);
        }
    };

    const bookReviews = getBookReviews(book.id);
    const myReview = bookReviews.find(r => r.userId === user?.uid);
    const avgRating = bookReviews.length > 0
        ? (bookReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / bookReviews.length).toFixed(1)
        : null;

    const handleSubmitReview = async () => {
        if (!reviewRating || !reviewComment.trim()) return;
        setSubmittingReview(true);
        try {
            const success = await addReview({
                bookId: book.id,
                bookTitle: book.title,
                userId: user.uid,
                userName: userData?.displayName || user?.displayName || user?.email?.split('@')[0],
                userPhoto: user?.photoURL,
                rating: reviewRating,
                comment: reviewComment.trim()
            });
            if (success) {
                setReviewComment('');
                setReviewRating(0);
            }
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm(t('reviews.deleteConfirm', 'Bu yorumu silmek istediğinize emin misiniz?'))) {
            await deleteReview(reviewId);
        }
    };

    const isAvailable = book.available > 0;
    const reservations = book.reservations || [];
    const isReservedByMe = reservations.some(r => r.uid === user?.uid);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div className="modal-header">
                    <h2 className="modal-title">📖 {t('books.detailTitle')}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <div className={styles.detailContent} style={{ overflowY: 'auto', flex: 1 }}>
                    {book.thumbnail && (
                        <img src={book.thumbnail} alt={book.title} className={styles.detailCover} />
                    )}
                    <h2>{book.title}</h2>
                    {book.subtitle && <p className={styles.subtitle}>{book.subtitle}</p>}
                    <p className={styles.detailAuthor}>{book.authors}</p>

                    <div className={styles.detailMeta} style={{ marginBottom: '1rem' }}>
                        {book.categories && <span className="badge badge-primary">{book.categories}</span>}
                        {book.published_year && <span className="badge badge-gray">{book.published_year}</span>}
                        {book.num_pages && <span className="badge badge-gray">{t('books.detailPages', { count: book.num_pages })}</span>}
                        {book.average_rating > 0 && (
                            <span className="badge badge-warning">⭐ {parseFloat(book.average_rating).toFixed(1)} ({t('books.detailReviews', { count: book.ratings_count || 0 })})</span>
                        )}
                        <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                            {isAvailable ? `${book.available} ${t('common.available', 'Mevcut')}` : t('common.outOfStock', 'Tükendi')}
                        </span>
                    </div>

                    {!isAvailable && (
                        <div style={{ padding: '1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('books.queue', 'Bekleme Sırası')}: {reservations.length} kişi</p>
                                {isReservedByMe && <p style={{ color: 'var(--success-500)', fontSize: '0.85rem' }}>{t('books.youAreInQueue', 'Bu kitap için sıradasınız.')}</p>}
                            </div>
                            {!isReservedByMe && (
                                <button className="btn btn-primary" onClick={handleReserve} disabled={reserving}>
                                    {reserving ? t('common.loading') : 'Sıraya Gir'}
                                </button>
                            )}
                        </div>
                    )}

                    {userData?.role !== 'member' && reservations.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Rezervasyon Listesi ({reservations.length})</h4>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                                {reservations.map((r, i) => (
                                    <li key={i} style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{i + 1}. {r.name}</span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>{new Date(r.date).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {book.isbn13 && <p className={styles.isbn}>ISBN: {book.isbn13}</p>}
                    {book.description && <p className={styles.description}>{book.description}</p>}

                    {/* Reviews Section */}
                    <div className={styles.reviewsSection}>
                        <div className={styles.reviewsHeader}>
                            <h3>
                                <MessageSquare size={18} />
                                {t('reviews.title', 'Yorumlar')}
                                {bookReviews.length > 0 && <span className={styles.reviewCount}>({bookReviews.length})</span>}
                            </h3>
                            {avgRating && (
                                <div className={styles.avgRating}>
                                    <Star size={16} fill="var(--warning-400)" color="var(--warning-400)" />
                                    <span>{avgRating}</span>
                                </div>
                            )}
                        </div>

                        {/* Review Form */}
                        {user && !myReview && (
                            <div className={styles.reviewForm}>
                                <div className={styles.starPicker}>
                                    <span className={styles.starLabel}>{t('reviews.yourRating', 'Puanınız')}:</span>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={styles.starBtn}
                                            onMouseEnter={() => setReviewHover(star)}
                                            onMouseLeave={() => setReviewHover(0)}
                                            onClick={() => setReviewRating(star)}
                                        >
                                            <Star
                                                size={22}
                                                fill={star <= (reviewHover || reviewRating) ? 'var(--warning-400)' : 'transparent'}
                                                color={star <= (reviewHover || reviewRating) ? 'var(--warning-400)' : 'var(--gray-400)'}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className={styles.reviewInputRow}>
                                    <textarea
                                        className="form-input"
                                        placeholder={t('reviews.placeholder', 'Bu kitap hakkında ne düşünüyorsunuz?')}
                                        value={reviewComment}
                                        onChange={e => setReviewComment(e.target.value)}
                                        rows={2}
                                        style={{ resize: 'vertical', flex: 1 }}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview || !reviewRating || !reviewComment.trim()}
                                        style={{ alignSelf: 'flex-end' }}
                                    >
                                        <Send size={16} />
                                        {submittingReview ? t('common.loading') : t('reviews.submit', 'Gönder')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reviews List */}
                        {bookReviews.length === 0 ? (
                            <p className={styles.noReviews}>{t('reviews.noReviews', 'Henüz yorum yapılmamış. İlk yorumu siz yapın!')}</p>
                        ) : (
                            <div className={styles.reviewsList}>
                                {bookReviews.map(review => (
                                    <div key={review.id} className={styles.reviewItem}>
                                        <div className={styles.reviewTop}>
                                            <div className={styles.reviewUser}>
                                                <div className={styles.reviewAvatar}>
                                                    {review.userPhoto
                                                        ? <img src={review.userPhoto} alt="" />
                                                        : (review.userName?.charAt(0) || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className={styles.reviewName}>{review.userName}</span>
                                                    <span className={styles.reviewDate}>{formatDate(review.createdAtISO)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.reviewRight}>
                                                <div className={styles.reviewStars}>
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star
                                                            key={s}
                                                            size={14}
                                                            fill={s <= review.rating ? 'var(--warning-400)' : 'transparent'}
                                                            color={s <= review.rating ? 'var(--warning-400)' : 'var(--gray-400)'}
                                                        />
                                                    ))}
                                                </div>
                                                {review.userId === user?.uid && (
                                                    <button
                                                        className="btn-icon"
                                                        style={{ color: 'var(--danger-500)', marginLeft: 4 }}
                                                        onClick={() => handleDeleteReview(review.id)}
                                                        title={t('reviews.delete', 'Yorumu Sil')}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className={styles.reviewText}>{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function BookFormModal({ book, onSave, onClose, t }) {
    const [form, setForm] = useState({
        title: book?.title || '',
        authors: book?.authors || '',
        isbn13: book?.isbn13 || '',
        categories: book?.categories || '',
        published_year: book?.published_year || '',
        num_pages: book?.num_pages || '',
        description: book?.description || '',
        thumbnail: book?.thumbnail || '',
        quantity: book?.quantity || 1,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try { await onSave(form); } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{book ? `✏️ ${t('books.editBook')}` : `➕ ${t('books.newBook')}`}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label className="form-label">{t('books.formTitle')}</label>
                            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('books.formAuthor')}</label>
                            <input className="form-input" value={form.authors} onChange={e => setForm({ ...form, authors: e.target.value })} required />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">{t('books.formIsbn')}</label>
                                <input className="form-input" value={form.isbn13} onChange={e => setForm({ ...form, isbn13: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('books.formCategory')}</label>
                                <input className="form-input" value={form.categories} onChange={e => setForm({ ...form, categories: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">{t('books.formYear')}</label>
                                <input type="number" className="form-input" value={form.published_year} onChange={e => setForm({ ...form, published_year: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('books.formPages')}</label>
                                <input type="number" className="form-input" value={form.num_pages} onChange={e => setForm({ ...form, num_pages: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('books.formQty')}</label>
                                <input type="number" className="form-input" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min={1} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('books.formCoverUrl')}</label>
                            <input className="form-input" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('books.formDesc')}</label>
                            <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? t('books.btnSaving') : book ? t('books.btnUpdate') : t('books.btnSave')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
