export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getRoleLabel(role) {
    const map = { admin: 'Yönetici', librarian: 'Kütüphaneci', member: 'Üye', tester: 'Test Kullanıcı' };
    return map[role] || role;
}

export function getRoleEmoji(role) {
    const map = { admin: '👑', librarian: '📚', member: '👤', tester: '🧪' };
    return map[role] || '👤';
}

export function truncate(str, max = 100) {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

export function getStatusBadge(status) {
    const map = {
        borrowed: { label: 'Ödünç', class: 'badge-primary' },
        overdue: { label: 'Gecikmiş', class: 'badge-danger' },
        returned: { label: 'İade Edildi', class: 'badge-success' },
        active: { label: 'Aktif', class: 'badge-success' },
        inactive: { label: 'Pasif', class: 'badge-gray' },
    };
    return map[status] || { label: status, class: 'badge-gray' };
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
