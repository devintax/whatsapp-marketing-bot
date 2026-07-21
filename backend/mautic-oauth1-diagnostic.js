// Mautic OAuth1 diagnostic and contact fetch
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const axios = require('axios');

const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
const CONSUMER_KEY = '239iw9gpwvi8sw8www8k80ggg8ss4csso4cgkkko8cgsgswcw8';
const CONSUMER_SECRET = '1spu3ppjxzgkokocs8csssc0w0ko4scw48gg88k8cooookw0o8';
const CALLBACK_URL = 'https://api.vemgootech.info/api/auth/mautic/callback';

async function testOAuth1Mautic() {
  const oauth = OAuth({
    consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    },
  });

  // Step 1: Get request token
  try {
    const requestData = {
      url: `${MAUTIC_BASE_URL}/api/oauth1/request_token`,
      method: 'POST',
      data: { oauth_callback: CALLBACK_URL },
    };
    const headers = oauth.toHeader(oauth.authorize(requestData));
    const res = await axios.post(requestData.url, null, { headers });
    console.log('Request Token Response:', res.data);
    // Step 2: User authorization required (manual step)
    // Step 3: Exchange for access token (skipped for diagnostic)
  } catch (err) {
    console.error('OAuth1 Request Token Error:', err.response ? err.response.data : err.message);
    return;
  }

  // Step 4: Try to fetch contacts (if access token available)
  // This step requires manual authorization, so we stop here for diagnostic
}

testOAuth1Mautic();
