/**
 * Admin & Tester User Seeding Script
 *
 * Kullanım:
 *   node scripts/seed-users.cjs
 *
 * Bu script Firebase Auth'da iki kullanıcı oluşturur ve Firestore 'users' koleksiyonuna yazar:
 *   - admin@library.com (role: admin)
 *   - tester@library.com (role: tester)
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const USERS = [
    {
        email: 'admin@library.com',
        password: 'admin123456',
        displayName: 'Admin User',
        role: 'admin'
    },
    {
        email: 'tester@library.com',
        password: 'tester123456',
        displayName: 'Test User',
        role: 'tester'
    }
];

async function seedUsers() {
    console.log('🔐 Kullanıcılar oluşturuluyor...\n');

    for (const userData of USERS) {
        try {
            // Check if user already exists
            let userRecord;
            try {
                userRecord = await auth.getUserByEmail(userData.email);
                console.log(`⚠️  ${userData.email} zaten mevcut (uid: ${userRecord.uid})`);
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    // Create the user
                    userRecord = await auth.createUser({
                        email: userData.email,
                        password: userData.password,
                        displayName: userData.displayName,
                        emailVerified: true
                    });
                    console.log(`✅ ${userData.email} oluşturuldu (uid: ${userRecord.uid})`);
                } else {
                    throw err;
                }
            }

            // Create/update Firestore user doc
            const userRef = db.collection('users').doc(userRecord.uid);
            await userRef.set({
                displayName: userData.displayName,
                email: userData.email,
                photoURL: null,
                role: userData.role,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`   📝 Firestore doc yazıldı — role: ${userData.role}\n`);

        } catch (err) {
            console.error(`❌ ${userData.email} işlenirken hata:`, err.message);
        }
    }

    console.log('🏁 Seed tamamlandı!');
    console.log('\n📋 Giriş Bilgileri:');
    console.log('╔══════════════════════════════════════════╗');
    console.log('║  Admin:  admin@library.com / admin123456 ║');
    console.log('║  Tester: tester@library.com / tester123456║');
    console.log('╚══════════════════════════════════════════╝');
    process.exit(0);
}

seedUsers().catch(err => {
    console.error('❌ Genel hata:', err);
    process.exit(1);
});
