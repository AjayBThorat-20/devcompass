// src/utils/encryption.js
const crypto = require('crypto');
const os = require('os');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Generate encryption key from machine-specific data
function getEncryptionKey() {
  const machineId = `${os.hostname()}-${os.userInfo().username}`;
  return crypto.createHash('sha256').update(machineId).digest();
}

/**
 * Encrypt sensitive data (API keys)
 */
function encrypt(text) {
  if (!text) return null;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine iv + authTag + encrypted
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedData) {
  if (!encryptedData) return null;

  try {
    const key = getEncryptionKey();
    
    // Extract iv, authTag, and encrypted data
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}

/**
 * Mask API key for display
 */
function maskToken(token) {
  if (!token || token.length < 12) return '***';
  return token.slice(0, 7) + '***' + token.slice(-4);
}

module.exports = {
  encrypt,
  decrypt,
  maskToken
};