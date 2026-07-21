// Mautic OAuth2 diagnostic and contact fetch
const axios = require('axios');

const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
const CLIENT_ID = '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o';
const CLIENT_SECRET = '5wwj7f3eaygwggs4080o04gkgkko4owkw8wcoskkoogwwc8s4o';
const REDIRECT_URI = 'https://connect.vemgootech.info/api/auth/mautic/callback';

async function testOAuth2Mautic() {
  try {
    // Step 1: Get authorization code (manual step, print URL)
    const authUrl = `${MAUTIC_BASE_URL}/oauth/v2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    console.log('Go to this URL and authorize:', authUrl);
    // Step 2: User must paste the code here
    // For automation, you would need to handle the callback, but for now, prompt for code
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    readline.question('Paste the authorization code: ', async (code) => {
      readline.close();
      // Step 3: Exchange code for access token (send as form data)
      try {
        const qs = require('querystring');
        const tokenRes = await axios.post(
          `${MAUTIC_BASE_URL}/oauth/v2/token`,
          qs.stringify({
            grant_type: 'authorization_code',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            code,
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );
        console.log('Access Token Response:', tokenRes.data);
        const accessToken = tokenRes.data.access_token;
        // Step 4: Fetch contacts
        const contactsRes = await axios.get(`${MAUTIC_BASE_URL}/api/contacts`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('Contacts:', contactsRes.data);
      } catch (err) {
        console.error('Token or Contact Fetch Error:', err.response ? err.response.data : err.message);
      }
    });
  } catch (err) {
    console.error('OAuth2 Diagnostic Error:', err.message);
  }
}

testOAuth2Mautic();
