const express = require('express');
const auth = require('../middleware/auth');
const channelRegistry = require('../services/channelRegistry');

const router = express.Router();

router.get('/', auth, (req, res) => {
  res.json({
    channels: channelRegistry.listChannels(),
  });
});

router.get('/health', auth, async (req, res) => {
  try {
    const channels = await channelRegistry.checkAllChannelHealth();
    res.json({ channels });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to check channel health',
      error: error.message,
    });
  }
});

module.exports = router;
