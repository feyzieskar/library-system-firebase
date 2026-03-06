import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, getDocs, doc, addDoc, deleteDoc, where, serverTimestamp, limit as fsLimit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { showToast as toast } from '../components/common/Toast';

export function useReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAllReviews = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Reviews fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAllReviews(); }, []);

    const getBookReviews = (bookId) => {
        return reviews.filter(r => r.bookId === bookId);
    };

    const getRecentReviews = (count = 5) => {
        return reviews.slice(0, count);
    };

    const addReview = async ({ bookId, bookTitle, userId, userName, userPhoto, rating, comment }) => {
        try {
            // Check if user already reviewed this book
            const existing = reviews.find(r => r.bookId === bookId && r.userId === userId);
            if (existing) {
                toast.error('Bu kitap için zaten yorum yapmışsınız.');
                return false;
            }

            await addDoc(collection(db, 'reviews'), {
                bookId,
                bookTitle,
                userId,
                userName,
                userPhoto: userPhoto || null,
                rating,
                comment,
                createdAt: serverTimestamp(),
                createdAtISO: new Date().toISOString()
            });
            toast.success('Yorumunuz başarıyla eklendi!');
            await fetchAllReviews();
            return true;
        } catch (err) {
            console.error('Add review error:', err);
            toast.error('Yorum eklenirken hata oluştu.');
            return false;
        }
    };

    const deleteReview = async (reviewId) => {
        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            toast.success('Yorum silindi.');
            await fetchAllReviews();
        } catch (err) {
            console.error('Delete review error:', err);
            toast.error('Yorum silinirken hata oluştu.');
        }
    };

    const getAverageRating = (bookId) => {
        const bookReviews = reviews.filter(r => r.bookId === bookId);
        if (bookReviews.length === 0) return 0;
        const sum = bookReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return (sum / bookReviews.length).toFixed(1);
    };

    return {
        reviews,
        loading,
        getBookReviews,
        getRecentReviews,
        addReview,
        deleteReview,
        getAverageRating,
        refetch: fetchAllReviews
    };
}
