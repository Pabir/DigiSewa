const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
db.collection('returns').get().then(snap => {
  console.log('Returns count:', snap.size);
  snap.forEach(doc => console.log(doc.id, doc.data()));
  process.exit(0);
});
