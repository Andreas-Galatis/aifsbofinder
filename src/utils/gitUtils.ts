/**
 * Git utilities for managing repository updates
 */

export const getLatestCommit = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/AIreas/aipropertyfinder/commits/main');
    const data = await response.json();
    return data.sha;
  } catch (error) {
    console.error('Error fetching latest commit:', error);
    return null;
  }
};

export const checkForUpdates = async (currentVersion: string) => {
  const latestCommit = await getLatestCommit();
  return latestCommit !== currentVersion;
};

export const getRepositoryUrl = () => {
  return 'https://github.com/AIreas/aipropertyfinder';
};