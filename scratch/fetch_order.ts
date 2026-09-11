import { getOrders } from '../src/services/firebaseService';

async function run() {
  const orders = await getOrders();
  const order = orders.find(o => o.id === 'ord-9400');
  console.log(JSON.stringify(order, null, 2));
}

run();
