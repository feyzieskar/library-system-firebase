import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useMembers() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'members'), orderBy('fullName'));
            const snap = await getDocs(q);
            setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Members fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMembers(); }, []);

    const addMember = async (data) => {
        await addDoc(collection(db, 'members'), {
            ...data,
            status: 'active',
            membershipDate: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
        });
        await fetchMembers();
    };

    const updateMember = async (id, data) => {
        await updateDoc(doc(db, 'members', id), data);
        await fetchMembers();
    };

    const deleteMember = async (id) => {
        await deleteDoc(doc(db, 'members', id));
        await fetchMembers();
    };

    return { members, loading, addMember, updateMember, deleteMember, refetch: fetchMembers };
}
