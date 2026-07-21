// mautic-contact-sync.js CLI entrypoint for manual sync and testing
const { fetchAccessToken, syncMauticContactsWithToken } = require('./services/mauticContactSync');

async function cliSync() {
  const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
  const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
  const CLIENT_ID = '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o';
  const REDIRECT_URI = 'https://connect.vemgootech.info/api/auth/mautic/callback';
  console.log('Go to this URL and authorize:');
  const authUrl = `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  console.log(authUrl);
  readline.question('Paste the authorization code: ', async (code) => {
    readline.close();
    try {
      const accessToken = await fetchAccessToken(code);
      console.log('Access token received. Fetching contacts...');
      const imported = await syncMauticContactsWithToken(accessToken);
      console.log(`Imported/updated ${imported} contacts from Mautic.`);
    } catch (err) {
      console.error('Sync error:', err.response ? err.response.data : err.message);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  cliSync();
}
