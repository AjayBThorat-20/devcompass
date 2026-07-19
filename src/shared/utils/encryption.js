// src/shared/utils/encryption.js

const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getSaltPath() {
  return path.join(os.homedir(), '.devcompass', '.encryption-salt');
}

function getOrCreateSalt() {
  const saltPath = getSaltPath();
  try {
    if (fs.existsSync(saltPath)) return fs.readFileSync(saltPath);
    const dir = path.dirname(saltPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const salt = crypto.randomBytes(SALT_LENGTH);
    fs.writeFileSync(saltPath, salt, { mode: 0o600 });
    return salt;
  } catch (error) {
    // Read-only home or similar — fall back to a fixed salt. This only degrades to
    // the previous (pre-salt) security level, it never breaks encrypt/decrypt.
    return crypto.createHash('sha256').update('devcompass-fallback-salt').digest();
  }
}

// Salted + computationally expensive (scrypt) key, tied to this machine/user and a
// persisted per-install salt so the key can't be recomputed from hostname/username alone.
function getEncryptionKey() {
  const material = `${os.hostname()}-${os.userInfo().username}`;
  return crypto.scryptSync(material, getOrCreateSalt(), 32);
}

// Pre-existing unsalted key, kept only so tokens encrypted before the salt was
// introduced can still be decrypted; never used for new encryption.
function getLegacyEncryptionKey() {
  return crypto.createHash('sha256').update(`${os.hostname()}-${os.userInfo().username}`).digest();
}

function encrypt(text) {
  if (!text) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

function decrypt(encryptedData) {
  if (!encryptedData) return null;
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex');
  const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

  for (const key of [getEncryptionKey(), getLegacyEncryptionKey()]) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) { /* try next key */ }
  }
  if (process.env.DEBUG) console.error('Decryption failed with all known keys');
  return null;
}

function maskToken(token) {
  if (!token || token.length < 12) return '***';
  return token.slice(0, 7) + '***' + token.slice(-4);
}

module.exports = { encrypt, decrypt, maskToken };