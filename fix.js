const fs = require('fs');
let c = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

c = c.replace(/supportTickets/g, 'support_tickets');
c = c.replace(/orderDate/g, 'createdAt');

if (!c.includes('export async function getUsersPaginated')) {
  c = c.replace('export async function getUserFromFirestore', 
`export async function getUsersPaginated(lastVisibleDoc?: any, pageSize: number = 20): Promise<{ users: User[], lastDoc: any }> {
  let usersList: User[] = [];
  let lastDoc: any = null;
  try {
    let q = query(collection(db, 'users'), limit(pageSize));
    if (lastVisibleDoc) {
      q = query(collection(db, 'users'), startAfter(lastVisibleDoc), limit(pageSize));
    }
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      querySnapshot.forEach(docSnap => {
        usersList.push({ id: docSnap.id, ...(docSnap.data() as any) } as User);
      });
    }
  } catch (err) {
    console.warn('Firestore fetch users paginated failed:', err);
  }
  return { users: usersList, lastDoc };
}

export async function getUserFromFirestore`);
}

fs.writeFileSync('src/services/firebaseService.ts', c);
console.log('Fixed firebaseService.ts');
