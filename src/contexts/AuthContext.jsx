import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simulatedRole, setSimulatedRole] = useState(null);

    // Ensure this user has a record in the 'members' collection
    const syncToMembers = async (firebaseUser) => {
        try {
            const q = query(collection(db, 'members'), where('uid', '==', firebaseUser.uid));
            const snap = await getDocs(q);

            const now = new Date().toISOString();

            if (snap.empty) {
                // No member doc for this user — create one
                await addDoc(collection(db, 'members'), {
                    fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                    email: firebaseUser.email,
                    phone: '',
                    status: 'active',
                    membershipDate: now.split('T')[0],
                    uid: firebaseUser.uid,
                    lastLogin: now,
                    createdAt: serverTimestamp()
                });
            } else {
                // Update lastLogin on existing member doc
                const memberDoc = snap.docs[0];
                await updateDoc(memberDoc.ref, { lastLogin: now });
            }
        } catch (err) {
            console.error('Member sync error:', err);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch or create user doc in Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                const now = new Date().toISOString();

                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                    // Update lastLogin
                    await updateDoc(userRef, { lastLogin: now }).catch(() => { });
                } else {
                    // First login — create user doc
                    const newUserData = {
                        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL || null,
                        role: 'member',
                        lastLogin: now,
                        createdAt: serverTimestamp()
                    };
                    await setDoc(userRef, newUserData);
                    setUserData(newUserData);
                }

                // Always sync to members collection
                await syncToMembers(firebaseUser);
            } else {
                setUser(null);
                setUserData(null);
                setSimulatedRole(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const register = async (email, password, displayName) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName });
        const userRef = doc(db, 'users', cred.user.uid);
        const newUserData = {
            displayName,
            email,
            photoURL: null,
            role: 'member',
            createdAt: serverTimestamp()
        };
        await setDoc(userRef, newUserData);
        setUserData(newUserData);
        return cred;
    };

    const loginWithGoogle = async () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = async () => {
        setSimulatedRole(null);
        return signOut(auth);
    };

    // Role helpers
    const getRole = () => {
        // If tester is simulating a role, return the simulated role
        if (userData?.role === 'tester' && simulatedRole) {
            return simulatedRole;
        }
        return userData?.role || 'member';
    };

    const isAdmin = () => getRole() === 'admin';
    const isTester = () => userData?.role === 'tester';
    const canManage = () => ['admin', 'librarian'].includes(getRole());

    // Tester-only: switch simulated role
    const switchRole = (newRole) => {
        if (userData?.role !== 'tester') return;
        setSimulatedRole(newRole);
    };

    const resetRole = () => {
        setSimulatedRole(null);
    };

    const value = {
        user,
        userData,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        getRole,
        isAdmin,
        isTester,
        canManage,
        simulatedRole,
        switchRole,
        resetRole
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
