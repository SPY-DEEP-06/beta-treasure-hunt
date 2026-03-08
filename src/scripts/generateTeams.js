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
  
  // Create 45 Teams with a small delay to avoid Firebase Auth rate limits
  for (let i = 1; i <= 45; i++) {
    // Add a 200ms delay between each user creation
    await new Promise(resolve => setTimeout(resolve, 200));
    const teamNumber = i.toString().padStart(2, '0');
    const teamName = `Team${teamNumber}`;
    const email = `${teamName}@beta.com`;
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
