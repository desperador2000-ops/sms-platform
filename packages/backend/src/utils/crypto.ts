import crypto from 'crypto';

export function aesGcmEncrypt(plaintext: Buffer, masterKey: string) {
  const key = Buffer.from(masterKey, 'base64');
  if (key.length !== 32) {
    throw new Error('AES_MASTER_KEY must be 32 bytes of base64-encoded data');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
}

export function aesGcmDecrypt(ciphertext: Buffer, iv: Buffer, tag: Buffer, masterKey: string) {
  const key = Buffer.from(masterKey, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
