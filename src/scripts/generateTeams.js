import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";

// Helper to generate a random 8-char password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

export const createTeams = async () => {
  const teams = [];
  const errors = [];
  
  // Generate a random 4-char batch ID so multiple clicks don't collide with existing emails in Firebase Auth
  const batchId = Math.random().toString(36).slice(-4);
  
  // Create 45 Teams with a small delay to avoid Firebase Auth rate limits
  for (let i = 1; i <= 45; i++) {
    // Add a 300ms delay between each user creation
    await new Promise(resolve => setTimeout(resolve, 300));
    const teamNumber = i.toString().padStart(2, '0');
    const teamName = `Team${teamNumber}`;
    const email = `team${teamNumber}-${batchId}@beta.com`;
    const password = generatePassword();
    
    try {
      console.log(`Creating ${teamName}...`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store in auth but we need to export csv
      teams.push({
        teamName,
        email,
        password,
        uid: userCredential.user.uid
      });
      
      // we don't initialize team state fully here, they do that on login
      // but we register the basic document
      await setDoc(doc(db, "Teams", userCredential.user.uid), {
        email: email,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
    } catch (err) {
      console.error(`Error creating ${teamName}`, err);
      errors.push({ teamName, error: err.message });
    }
  }

  // Convert to CSV
  const csvContent = "data:text/csv;charset=utf-8," 
    + "TeamName,Email,Password\n"
    + teams.map(t => `${t.teamName},${t.email},${t.password}`).join("\n");
    
  // Download CSV
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "beta_teams_credentials.csv");
  document.body.appendChild(link);
  link.click();
  
  return { teams, errors };
};
