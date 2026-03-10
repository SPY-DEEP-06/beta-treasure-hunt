import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyAauOTzBh-9Rg5voe4f3EGuLePUUgZ_Ptw",
  projectId: "beta-treasure-hunt",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const lines = [];
  const snapshot = await getDocs(collection(db, "Teams"));
  snapshot.forEach(doc => {
    lines.push(`${doc.id} => Name: ${doc.data().teamName}, RiddleIndex: ${doc.data().initialRiddleIndex}`);
  });
  fs.writeFileSync('db_output.txt', lines.join('\n'));
  process.exit(0);
}
test().catch(console.error);
