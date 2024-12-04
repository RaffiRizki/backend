import { Firestore } from '@google-cloud/firestore';

async function storeData(id, data) {
    const db = new Firestore();
    return db.collection('predictions').doc(id).set(data);
}

async function getData(id) {
    const db = new Firestore();
    const doc = await db.collection('predictions').doc(id).get();
    return doc.exists ? doc.data() : null;
}

async function getHistories() {
    const db = new Firestore();
    const snapshot = await db.collection('predictions').get();
    return snapshot.docs.map(doc => doc.data());
}

export { storeData, getData, getHistories };

