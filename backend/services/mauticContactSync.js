// services/mauticContactSync.js
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const qs = require('querystring');

const MAUTIC_BASE_URL = 'https://dfgbusiness.com/mautic';
const CLIENT_ID = '1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o';
const CLIENT_SECRET = '5wwj7f3eaygwggs4080o04gkgkko4owkw8wcoskkoogwwc8s4o';
const REDIRECT_URI = 'https://connect.vemgootech.info/api/auth/mautic/callback';
const MONGODB_URI = process.env.MONGODB_URI;

const contactSchema = new mongoose.Schema({
  mauticId: { type: String, unique: true },
  email: String,
  firstName: String,
  lastName: String,
  phone: String,
  tags: [String],
  raw: Object,
});
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);


// Store tokens in memory (replace with DB or Redis for production)
let mauticTokens = {
  access_token: null,
  refresh_token: null,
  expires_at: null, // timestamp
};

async function fetchAccessToken(authCode) {
  const tokenRes = await axios.post(
    `${MAUTIC_BASE_URL}/oauth/v2/token`,
    qs.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: authCode,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const { access_token, refresh_token, expires_in } = tokenRes.data;
  mauticTokens.access_token = access_token;
  mauticTokens.refresh_token = refresh_token;
  mauticTokens.expires_at = Date.now() + (expires_in * 1000) - 60000; // 1 min early
  return access_token;
}

async function refreshAccessToken() {
  if (!mauticTokens.refresh_token) throw new Error('No refresh token available');
  const tokenRes = await axios.post(
    `${MAUTIC_BASE_URL}/oauth/v2/token`,
    qs.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      refresh_token: mauticTokens.refresh_token,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const { access_token, refresh_token, expires_in } = tokenRes.data;
  mauticTokens.access_token = access_token;
  mauticTokens.refresh_token = refresh_token;
  mauticTokens.expires_at = Date.now() + (expires_in * 1000) - 60000;
  return access_token;
}

function setTokens({ access_token, refresh_token, expires_in }) {
  mauticTokens.access_token = access_token;
  mauticTokens.refresh_token = refresh_token;
  mauticTokens.expires_at = Date.now() + (expires_in * 1000) - 60000;
}

function getTokens() {
  return { ...mauticTokens };
}

async function getValidAccessToken() {
  if (mauticTokens.access_token && mauticTokens.expires_at && Date.now() < mauticTokens.expires_at) {
    return mauticTokens.access_token;
  }
  if (mauticTokens.refresh_token) {
    return await refreshAccessToken();
  }
  throw new Error('No valid access or refresh token available. Re-authenticate.');
}

async function syncMauticContactsWithToken(accessToken) {
  let page = 1, hasMore = true, imported = 0;
  await mongoose.connect(MONGODB_URI);
  while (hasMore) {
    const res = await axios.get(`${MAUTIC_BASE_URL}/api/contacts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { page, limit: 100 },
    });
    const contacts = res.data.contacts || {};
    const ids = Object.keys(contacts);
    if (ids.length === 0) break;
    for (const id of ids) {
      const c = contacts[id];
      await Contact.findOneAndUpdate(
        { mauticId: id },
        {
          mauticId: id,
          email: c.fields?.all?.email || '',
          firstName: c.fields?.all?.firstname || '',
          lastName: c.fields?.all?.lastname || '',
          phone: c.fields?.all?.phone || '',
          tags: c.tags ? c.tags.map(t => t.tag) : [],
          raw: c,
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      imported++;
    }
    hasMore = ids.length === 100;
    page++;
  }
  await mongoose.disconnect();
  return imported;
}

module.exports = {
  fetchAccessToken,
  refreshAccessToken,
  getValidAccessToken,
  setTokens,
  getTokens,
  syncMauticContactsWithToken,
};
