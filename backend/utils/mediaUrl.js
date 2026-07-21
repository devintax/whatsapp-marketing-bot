const path = require('path');

const uploadRoot = () => path.resolve(process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads'));

const normalizeUrlPath = (value) => value.replace(/\\/g, '/').replace(/^\/+/, '');

const mediaPublicBaseUrl = () => (
  process.env.MEDIA_PUBLIC_URL
  || process.env.CDN_BASE_URL
  || ''
).replace(/\/+$/, '');

const toMediaPath = (relativePath) => {
  const normalized = normalizeUrlPath(relativePath);
  return `/media/${normalized.replace(/^uploads\//, '')}`;
};

const toLegacyUploadPath = (relativePath) => {
  const normalized = normalizeUrlPath(relativePath);
  return `/uploads/${normalized.replace(/^uploads\//, '')}`;
};

const publicMediaUrl = (relativePath) => {
  const mediaPath = toMediaPath(relativePath);
  const baseUrl = mediaPublicBaseUrl();
  return baseUrl ? `${baseUrl}${mediaPath}` : mediaPath;
};

module.exports = {
  uploadRoot,
  publicMediaUrl,
  toLegacyUploadPath,
  toMediaPath,
};
