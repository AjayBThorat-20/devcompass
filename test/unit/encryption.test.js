// test/unit/encryption.test.js
// Covers the scrypt upgrade: new encrypt/decrypt round-trips, and decrypt still
// reads ciphertext produced by the pre-upgrade unsalted sha256 key (legacy fallback).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const os = require('node:os');
const { encrypt, decrypt, maskToken } = require('../../src/shared/utils/encryption');

test('encrypt/decrypt round-trips a secret', () => {
  const secret = 'sk-test-1234567890abcdef';
  const encrypted = encrypt(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decrypt(encrypted), secret);
});

test('encrypt produces a fresh IV each call (ciphertext is not deterministic)', () => {
  const secret = 'same-secret';
  assert.notEqual(encrypt(secret), encrypt(secret));
});

test('decrypt returns null for garbage input instead of throwing', () => {
  assert.equal(decrypt('not-valid-hex-ciphertext'), null);
  assert.equal(decrypt(''), null);
  assert.equal(decrypt(null), null);
});

test('decrypt falls back to the legacy unsalted key for pre-upgrade ciphertext', () => {
  // Replicates the old getEncryptionKey() formula (sha256, no salt) that
  // encryption.js keeps as getLegacyEncryptionKey() for backward compatibility.
  const ALGORITHM = 'aes-256-gcm';
  const IV_LENGTH = 12;
  const legacyKey = crypto.createHash('sha256').update(`${os.hostname()}-${os.userInfo().username}`).digest();

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, legacyKey, iv);
  const secret = 'legacy-secret-value';
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  const legacyCiphertext = iv.toString('hex') + authTag.toString('hex') + encrypted;

  assert.equal(decrypt(legacyCiphertext), secret);
});

test('maskToken hides the middle of a token', () => {
  assert.equal(maskToken('sk-test-1234567890abcdef'), 'sk-test***cdef');
  assert.equal(maskToken('short'), '***');
  assert.equal(maskToken(''), '***');
});
