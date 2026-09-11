const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
db.collection("sellers").get().then(snapshot => {
  if (snapshot.empty) {
    console.log("No sellers found.");
    return;
  }
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("ID:", doc.id);
    console.log("Email:", data.email);
    console.log("Phone:", data.phone);
    console.log("Store:", data.storeName);
    console.log("Password:", data.password);
    console.log("----------------------");
  });
}).catch(console.error);
