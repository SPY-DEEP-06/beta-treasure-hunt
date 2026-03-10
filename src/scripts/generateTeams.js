import { teamCredentials } from '../data/teamCredentials';

export const createTeams = async () => {
  const teams = [];
  const errors = [];

  // Try to create Firebase Auth Users and map them
  for (const [index, creds] of teamCredentials.entries()) {
    const teamNumber = (index + 1).toString().padStart(2, '0');
    const teamName = `Team${teamNumber}`;

    teams.push({
      teamName,
      email: creds.email,
      password: creds.password,
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
