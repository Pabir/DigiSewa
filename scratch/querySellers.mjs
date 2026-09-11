import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCZK4mCFHiBlCyU-7ROICitSes0krqyfLI",
  authDomain: "digisewa-ac3c4.firebaseapp.com",
  projectId: "digisewa-ac3c4",
  storageBucket: "digisewa-ac3c4.firebasestorage.app",
  messagingSenderId: "1064799817380",
  appId: "1:1064799817380:web:c42bb12b1a6f151dc72031"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  await signInAnonymously(auth);
  const snap = await getDocs(collection(db, "sellers"));
  console.log("Total sellers:", snap.size);
  snap.forEach(doc => {
    console.log(doc.data().email);
  });
  process.exit(0);
}

run().catch(console.error);
