const axios = require('axios');

const enabled = (value) => String(value || 'false').toLowerCase() === 'true';

const configured = (keys) => keys.some((key) => Boolean(process.env[key]));

const channelDefinitions = [
  {
    id: 'whatsapp_web',
    name: 'WhatsApp Web.js',
    enabled: true,
    configured: true,
    healthUrl: null,
    role: 'Existing QR-based WhatsApp sender',
  },
  {
    id: 'openwa',
    name: 'OpenWA',
    enabled: enabled(process.env.OPENWA_ENABLED),
    configured: configured(['OPENWA_BASE_URL']),
    healthUrl: process.env.OPENWA_HEALTH_URL || (process.env.OPENWA_BASE_URL ? `${process.env.OPENWA_BASE_URL}/health` : null),
    role: 'Self-hosted WhatsApp automation adapter',
  },
  {
    id: 'waha',
    name: 'WAHA',
    enabled: enabled(process.env.WAHA_ENABLED),
    configured: configured(['WAHA_BASE_URL']),
    healthUrl: process.env.WAHA_HEALTH_URL || (process.env.WAHA_BASE_URL ? `${process.env.WAHA_BASE_URL}/api/sessions` : null),
    role: 'Self-hosted WhatsApp HTTP API adapter',
  },
  {
    id: 'wazo',
    name: 'Wazo',
    enabled: enabled(process.env.WAZO_ENABLED),
    configured: configured(['WAZO_BASE_URL']),
    healthUrl: process.env.WAZO_HEALTH_URL || (process.env.WAZO_BASE_URL ? `${process.env.WAZO_BASE_URL}/api` : null),
    role: 'Voice, SMS, and telephony adapter',
  },
];

const authHeadersFor = (channelId) => {
  if (channelId === 'openwa' && process.env.OPENWA_API_KEY) {
    return { Authorization: `Bearer ${process.env.OPENWA_API_KEY}` };
  }

  if (channelId === 'waha' && process.env.WAHA_API_KEY) {
    return { 'X-Api-Key': process.env.WAHA_API_KEY };
  }

  if (channelId === 'wazo' && process.env.WAZO_TOKEN) {
    return { 'X-Auth-Token': process.env.WAZO_TOKEN };
  }

  return {};
};

const listChannels = () => channelDefinitions.map((channel) => ({
  id: channel.id,
  name: channel.name,
  enabled: channel.enabled,
  configured: channel.configured,
  role: channel.role,
  healthUrl: channel.healthUrl,
}));

const checkChannelHealth = async (channel) => {
  if (!channel.enabled) {
    return { ...channel, status: 'disabled' };
  }

  if (!channel.configured || !channel.healthUrl) {
    return { ...channel, status: 'not_configured' };
  }

  try {
    const startedAt = Date.now();
    const response = await axios.get(channel.healthUrl, {
      timeout: Number(process.env.CHANNEL_HEALTH_TIMEOUT_MS || 4000),
      headers: authHeadersFor(channel.id),
      validateStatus: (status) => status < 500,
    });

    return {
      ...channel,
      status: response.status < 400 ? 'healthy' : 'degraded',
      statusCode: response.status,
      responseTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ...channel,
      status: 'unreachable',
      error: error.message,
    };
  }
};

const checkAllChannelHealth = async () => {
  const channels = listChannels();
  return Promise.all(channels.map(checkChannelHealth));
};

module.exports = {
  listChannels,
  checkAllChannelHealth,
};
