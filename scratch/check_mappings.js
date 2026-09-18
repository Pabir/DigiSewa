const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  initializeApp({
    credential: cert(serviceAccount)
  });
} else {
  initializeApp();
}

async function run() {
  try {
    const db = getFirestore();
    const mapDoc = await db.collection('catalog_settings').doc('category_mappings').get();
    if (mapDoc.exists) {
      const data = mapDoc.data();
      const mappings = data.mappings || [];
      console.log(`Found ${mappings.length} mappings in Firestore!`);
      if (mappings.length > 0) {
        fs.writeFileSync(path.join(__dirname, 'mappings_backup.json'), JSON.stringify(mappings, null, 2));
      }
    } else {
      console.log('Document catalog_settings/category_mappings does not exist.');
    }
  } catch (error) {
    console.error('Error fetching mappings:', error);
  }
}

run();
