import { useState, useEffect, useMemo } from 'react';
import {
    collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next';
import { showToast as toast } from '../components/common/Toast';

export function useBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'books'), orderBy('title'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setBooks(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooks(); }, []);

    const fuse = useMemo(() => new Fuse(books, {
        keys: ['title', 'authors', 'isbn13', 'isbn10'],
        threshold: 0.3,
        ignoreLocation: true
    }), [books]);

    const searchBooks = (searchTerm, category, yearRange, ratingRange) => {
        let results = books;

        if (searchTerm?.trim()) {
            results = fuse.search(searchTerm).map(r => r.item);
        }

        if (category) {
            results = results.filter(b => b.categories === category);
        }

        if (yearRange) {
            results = results.filter(b => {
                const y = parseInt(b.published_year);
                return y >= yearRange[0] && y <= yearRange[1];
            });
        }

        if (ratingRange) {
            results = results.filter(b => {
                const r = parseFloat(b.average_rating) || 0;
                return r >= ratingRange[0] && r <= ratingRange[1];
            });
        }

        return results;
    };

    const categories = useMemo(() => {
        const cats = new Set();
        books.forEach(b => { if (b.categories) cats.add(b.categories); });
        return [...cats].sort();
    }, [books]);

    const addBook = async (bookData) => {
        const docRef = await addDoc(collection(db, 'books'), {
            ...bookData,
            quantity: parseInt(bookData.quantity) || 1,
            available: parseInt(bookData.quantity) || 1,
            createdAt: serverTimestamp()
        });
        await fetchBooks();
        return docRef.id;
    };

    const updateBook = async (id, bookData) => {
        await updateDoc(doc(db, 'books', id), bookData);
        await fetchBooks();
    };

    const deleteBook = async (id) => {
        try {
            await deleteDoc(doc(db, 'books', id));
            toast.success(t('books.deleteSuccess', 'Kitap başarıyla silindi'));
        } catch (err) {
            console.error(err);
            toast.error(t('books.errDelete', 'Kitap silinirken hata oluştu'));
            throw err;
        }
    };

    const reserveBook = async (bookId, user) => {
        try {
            const bookRef = doc(db, 'books', bookId);
            const bookSnap = await getDoc(bookRef);
            if (!bookSnap.exists()) throw new Error('Kitap bulunamadı');

            const bookData = bookSnap.data();
            const reservations = bookData.reservations || [];

            // Mevcut kullanıcı zaten sırada mı kontrol et
            if (reservations.some(r => r.uid === user.uid)) {
                toast.error(t('books.alreadyReserved', 'Bu kitap için zaten sıradasınız'));
                return false;
            }

            const newReservation = {
                uid: user.uid,
                name: user.displayName || user.email,
                date: new Date().toISOString()
            };

            await updateDoc(bookRef, {
                reservations: [...reservations, newReservation]
            });
            toast.success(t('books.reserveSuccess', 'Kitap başarıyla rezerve edildi'));
            return true;
        } catch (err) {
            console.error(err);
            toast.error(t('books.errReserve', 'Rezervasyon yapılırken hata oluştu'));
            throw err;
        }
    };

    return { books, loading, error, searchBooks, categories, addBook, updateBook, deleteBook, reserveBook, refetch: fetchBooks };
}
