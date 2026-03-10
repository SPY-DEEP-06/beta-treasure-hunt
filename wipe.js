import { getDocs, collection, doc, deleteDoc } from 'firebase/firestore';
import { db } from './src/firebase/config.js';

const wipeCollections = async () => {
    console.log("Wiping all ghost teams from the database...");

    const teamsSnap = await getDocs(collection(db, 'Teams'));
    for (const document of teamsSnap.docs) {
        await deleteDoc(doc(db, 'Teams', document.id));
        console.log("Deleted team:", document.id);
    }

    const locSnap = await getDocs(collection(db, 'TeamLocations'));
    for (const document of locSnap.docs) {
        await deleteDoc(doc(db, 'TeamLocations', document.id));
        console.log("Deleted location node:", document.id);
    }

    console.log("Firebase wiped successfully!");
    process.exit(0);
}

wipeCollections().catch(console.error);
