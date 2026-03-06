/**
 * CSV → Firestore Import Script
 *
 * Kullanım:
 *   1. Firebase Console'dan Service Account key indirin
 *   2. Bu dosyayı düzenleyip Firebase config bilgilerinizi girin
 *   3. Çalıştırın: node scripts/import-books.cjs
 *
 * Not: Bu script firebase-admin kullanır, ayrıca kurulum gerekir:
 *   npm install firebase-admin csv-parser
 */

const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Firebase Admin SDK init
// Service account key dosyanızın yolunu buraya girin
// Firebase Console > Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importBooks() {
    const books = [];
    const csvPath = path.join(__dirname, '..', 'books.csv');

    console.log('📖 CSV dosyası okunuyor...');

    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                books.push({
                    isbn13: row.isbn13 || '',
                    isbn10: row.isbn10 || '',
                    title: row.title || '',
                    subtitle: row.subtitle || '',
                    authors: row.authors || '',
                    categories: row.categories || '',
                    thumbnail: row.thumbnail || '',
                    description: row.description || '',
                    published_year: row.published_year ? parseInt(row.published_year) : null,
                    average_rating: row.average_rating ? parseFloat(row.average_rating) : 0,
                    num_pages: row.num_pages ? parseInt(row.num_pages) : 0,
                    ratings_count: row.ratings_count ? parseInt(row.ratings_count) : 0,
                    quantity: 1,
                    available: 1,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`✅ ${books.length} kitap okundu. Firestore'a yazılıyor...`);

    // Batch write (Firestore max 500 per batch)
    const batchSize = 500;
    let written = 0;

    for (let i = 0; i < books.length; i += batchSize) {
        const batch = db.batch();
        const chunk = books.slice(i, i + batchSize);

        chunk.forEach(book => {
            const ref = db.collection('books').doc();
            batch.set(ref, book);
        });

        await batch.commit();
        written += chunk.length;
        console.log(`  📝 ${written}/${books.length} kitap yazıldı...`);
    }

    console.log(`\n🎉 Toplam ${books.length} kitap başarıyla Firestore'a aktarıldı!`);

    // Create sample members
    console.log('\n👥 Örnek üyeler oluşturuluyor...');
    const members = [
        { fullName: 'Ahmet Yılmaz', email: 'ahmet@mail.com', phone: '555-0001', address: 'Ankara, Çankaya', status: 'active' },
        { fullName: 'Ayşe Demir', email: 'ayse@mail.com', phone: '555-0002', address: 'İstanbul, Kadıköy', status: 'active' },
        { fullName: 'Mehmet Kaya', email: 'mehmet@mail.com', phone: '555-0003', address: 'İzmir, Alsancak', status: 'active' },
        { fullName: 'Fatma Öztürk', email: 'fatma@mail.com', phone: '555-0004', address: 'Bursa, Nilüfer', status: 'active' },
        { fullName: 'Ali Çelik', email: 'ali@mail.com', phone: '555-0005', address: 'Antalya, Muratpaşa', status: 'active' },
    ];

    const memberBatch = db.batch();
    members.forEach(m => {
        const ref = db.collection('members').doc();
        memberBatch.set(ref, {
            ...m,
            membershipDate: new Date().toISOString().split('T')[0],
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    await memberBatch.commit();
    console.log(`✅ ${members.length} üye oluşturuldu.`);

    console.log('\n🏁 Import tamamlandı!');
    process.exit(0);
}

importBooks().catch(err => {
    console.error('❌ Hata:', err);
    process.exit(1);
});
