const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
db.collection("products").get().then(snapshot => {
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log("ID:", doc.id);
    console.log("Title:", data.title);
    console.log("Sizes:", JSON.stringify(data.sizes || [], null, 2));
    console.log("ImageUrl length:", data.imageUrl ? data.imageUrl.length : 0);
    console.log("AdditionalImages:", data.additionalImages ? data.additionalImages.map(img => img.length) : []);
    console.log("----------------------");
  });
}).catch(console.error);
