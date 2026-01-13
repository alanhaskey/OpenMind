import { version as currentVersion } from '../../package.json';

const REPO_OWNER = 'alanhaskey';
const REPO_NAME = 'OpenMind';
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

/**
 * Compare two SemVer strings.
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareVersions(v1, v2) {
  const cleanV1 = v1.replace(/^v/, '');
  const cleanV2 = v2.replace(/^v/, '');
  
  const parts1 = cleanV1.split('.').map(Number);
  const parts2 = cleanV2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const n1 = parts1[i] || 0;
    const n2 = parts2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const latestVersion = data.tag_name; // e.g., "v1.0.7"
    
    // Check if latest version is greater than current
    if (compareVersions(latestVersion, currentVersion) > 0) {
      return {
        hasUpdate: true,
        currentVersion,
        latestVersion,
        releaseUrl: data.html_url,
        releaseNotes: data.body
      };
    }

    return { hasUpdate: false, currentVersion, latestVersion };
  } catch (error) {
    console.warn('Failed to check for updates:', error);
    return { hasUpdate: false, error: error.message };
  }
}
