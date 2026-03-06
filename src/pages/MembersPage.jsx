import { useState, useMemo } from 'react';
import { useMembers } from '../hooks/useMembers';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Users, Mail, Phone, MapPin, Edit, Trash2, X, ShieldAlert, Download, Clock } from 'lucide-react';
import { debounce, formatDate } from '../utils/helpers';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { motion } from 'framer-motion';
import styles from './Members.module.css';

const containerVariant = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function MembersPage() {
    const { members, loading, addMember, updateMember, deleteMember } = useMembers();
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);

    const filtered = useMemo(() => {
        if (!search) return members;
        const lower = search.toLowerCase();
        return members.filter(m =>
            m.fullName?.toLowerCase().includes(lower) ||
            m.email?.toLowerCase().includes(lower) ||
            m.phone?.includes(lower)
        );
    }, [members, search]);

    const handleSearch = debounce((val) => setSearch(val), 300);

    const openAdd = () => { setSelectedMember(null); setShowModal(true); };
    const openEdit = (member) => { setSelectedMember(member); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setSelectedMember(null); };

    const handleDelete = async (member) => {
        if (window.confirm(t('members.errDeleteConfirm', { name: member.fullName }))) {
            await deleteMember(member.id);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1>👥 {t('members.title')}</h1>
                    <p>{t('members.countMsg', { count: filtered.length })}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" onClick={() => exportToCSV(filtered, 'members-export', t)}>
                        <Download size={18} /> CSV
                    </button>
                    <button className="btn btn-secondary" onClick={() => {
                        const columns = [
                            { header: t('members.formName', 'İsim'), dataKey: 'fullName' },
                            { header: t('members.formEmail', 'E-posta'), dataKey: 'email' },
                            { header: t('members.formPhone', 'Telefon'), dataKey: 'phone' },
                            { header: t('members.formStatus', 'Durum'), dataKey: 'status' }
                        ];
                        exportToPDF(filtered, columns, 'members-export', t('nav.members', 'Üyeler'), t);
                    }}>
                        <Download size={18} /> PDF
                    </button>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={18} /> {t('members.addBtn')}
                    </button>
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('members.searchPlaceholder')}
                        onChange={e => handleSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', minWidth: '300px' }}
                    />
                </div>
            </div>

            {loading ? (
                <div className={styles.grid}>
                    {[1, 2, 3, 4, 5, 6].map(i => <MemberSkeleton key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Users size={48} />
                    <h3>{t('members.noMembers')}</h3>
                </div>
            ) : (
                <motion.div className={styles.grid} variants={containerVariant} initial="hidden" animate="visible">
                    {filtered.map(member => (
                        <motion.div key={member.id} variants={itemVariant}>
                            <MemberCard member={member} onEdit={openEdit} onDelete={handleDelete} t={t} />
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {showModal && (
                <MemberFormModal
                    member={selectedMember}
                    onSave={async (data) => {
                        if (selectedMember) await updateMember(selectedMember.id, data);
                        else await addMember(data);
                        closeModal();
                    }}
                    onClose={closeModal}
                    t={t}
                />
            )}
        </div>
    );
}

function MemberCard({ member, onEdit, onDelete, t }) {
    const initial = member.fullName ? member.fullName.charAt(0).toUpperCase() : '?';

    // Activity based on lastLogin — active if within 30 days
    const isActive = (() => {
        if (!member.lastLogin) return member.status === 'active';
        const lastLogin = new Date(member.lastLogin);
        const daysSince = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
    })();

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.avatar}>{initial}</div>
                <div className={styles.info}>
                    <h3>{member.fullName}</h3>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-gray'}`}>
                        {isActive ? t('common.active') : t('common.inactive')}
                    </span>
                    {member.role === 'admin' && <span className="badge badge-warning" style={{ marginLeft: 4 }}><ShieldAlert size={10} style={{ marginRight: 2 }} />Admin</span>}
                </div>
                <div className={styles.actions}>
                    <button className="btn-icon" onClick={() => onEdit(member)}><Edit size={16} /></button>
                    <button className="btn-icon" style={{ color: 'var(--danger-500)' }} onClick={() => onDelete(member)}><Trash2 size={16} /></button>
                </div>
            </div>
            <div className={styles.details}>
                <div className={styles.detailRow}><Mail size={16} /> <span>{member.email || '—'}</span></div>
                <div className={styles.detailRow}><Phone size={16} /> <span>{member.phone || '—'}</span></div>
                <div className={styles.detailRow}>
                    <Clock size={16} />
                    <span>{member.lastLogin ? formatDate(member.lastLogin) : t('members.neverLoggedIn', 'Henüz giriş yapmadı')}</span>
                </div>
            </div>
        </div>
    );
}

function MemberSkeleton() {
    return (
        <div className={`card ${styles.card}`}>
            <div style={{ display: 'flex', gap: 16 }}>
                <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 24 }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ width: '60%', height: 20, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: '30%', height: 16 }} />
                </div>
            </div>
        </div>
    );
}

function MemberFormModal({ member, onSave, onClose, t }) {
    const [form, setForm] = useState({
        fullName: member?.fullName || '',
        email: member?.email || '',
        phone: member?.phone || '',
        address: member?.address || '',
        status: member?.status || 'active'
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
                    <h2 className="modal-title">{member ? `✏️ ${t('members.editMember')}` : `➕ ${t('members.newMember')}`}</h2>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                            <label className="form-label">{t('members.formName')}</label>
                            <input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('members.formEmail')}</label>
                            <input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">{t('members.formPhone')}</label>
                                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('members.formStatus')}</label>
                                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="active">{t('common.active')}</option>
                                    <option value="inactive">{t('common.inactive')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('members.formAddress')}</label>
                            <textarea className="form-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? t('books.btnSaving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
