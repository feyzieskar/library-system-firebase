import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, getDocs, doc, addDoc, updateDoc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useBorrows() {
    const [borrows, setBorrows] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBorrows = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'borrows'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const today = new Date().toISOString().split('T')[0];
            const data = snap.docs.map(d => {
                const borrow = { id: d.id, ...d.data() };
                // Auto-mark overdue
                if (borrow.status === 'borrowed' && borrow.dueDate < today) {
                    borrow.status = 'overdue';
                    // Update in Firestore too
                    updateDoc(doc(db, 'borrows', d.id), { status: 'overdue' }).catch(() => { });
                }
                return borrow;
            });
            setBorrows(data);
        } catch (err) {
            console.error('Borrows fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBorrows(); }, []);

    const borrowBook = async ({ bookId, bookTitle, memberId, memberName, dueDate }) => {
        // Create borrow record
        await addDoc(collection(db, 'borrows'), {
            bookId,
            bookTitle,
            memberId,
            memberName,
            borrowDate: new Date().toISOString().split('T')[0],
            dueDate,
            returnDate: null,
            status: 'borrowed',
            createdAt: serverTimestamp()
        });

        // Decrease available count
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) {
            const available = (bookSnap.data().available || 1) - 1;
            await updateDoc(bookRef, { available: Math.max(0, available) });
        }

        await fetchBorrows();
    };

    const returnBook = async (borrowId) => {
        const borrowRef = doc(db, 'borrows', borrowId);
        const borrowSnap = await getDoc(borrowRef);
        if (!borrowSnap.exists()) return;

        const borrowData = borrowSnap.data();

        // Update borrow status
        await updateDoc(borrowRef, {
            status: 'returned',
            returnDate: new Date().toISOString().split('T')[0]
        });

        // Increase available count
        const bookRef = doc(db, 'books', borrowData.bookId);
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) {
            const available = (bookSnap.data().available || 0) + 1;
            await updateDoc(bookRef, { available });
        }

        await fetchBorrows();
    };

    const getStats = () => {
        const active = borrows.filter(b => b.status === 'borrowed').length;
        const overdue = borrows.filter(b => b.status === 'overdue').length;
        const returned = borrows.filter(b => b.status === 'returned').length;
        return { active, overdue, returned, total: borrows.length };
    };

    return { borrows, loading, borrowBook, returnBook, getStats, refetch: fetchBorrows };
}
