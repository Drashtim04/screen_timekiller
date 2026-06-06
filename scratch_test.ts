import { Cashfree } from 'cashfree-pg';
console.log('Cashfree keys:', Object.keys(Cashfree || {}));
console.log('Cashfree type:', typeof Cashfree);
try {
  const keys = Object.getOwnPropertyNames(Cashfree.prototype || {});
  console.log('Cashfree.prototype keys:', keys);
} catch (e) {
  console.log('No prototype or not a constructor:', e.message);
}
console.log('Cashfree properties:', Object.getOwnPropertyNames(Cashfree));
