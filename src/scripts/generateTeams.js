// Helper to generate a random 8-char password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

export const createTeams = async () => {
  const teams = [];
  const errors = [];
  
  // Generate a random 4-char batch ID to avoid any potential manual recreation clashes
  const batchId = Math.random().toString(36).slice(-4);
  
  // Instantly generate 45 Teams entirely client-side.
  // We completely bypass Firebase Auth Rate limits because users 
  // actually create their auth accounts automatically when they First Log in!
  for (let i = 1; i <= 45; i++) {
    const teamNumber = i.toString().padStart(2, '0');
    const teamName = `Team${teamNumber}`;
    const email = `team${teamNumber}-${batchId}@beta.com`;
    const password = generatePassword();
    
    teams.push({
      teamName,
      email,
      password,
    });
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
