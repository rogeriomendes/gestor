import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.BETTER_AUTH_SECRET;
  if (!key) {
    throw new Error("BETTER_AUTH_SECRET is not defined");
  }
  // Converter a string para um buffer de 32 bytes usando SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Criptografa uma senha usando AES-256-GCM
 * @param password - Senha em texto plano
 * @returns Senha criptografada em base64
 */
export function encryptPassword(password: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(
    key,
    salt,
    100_000,
    KEY_LENGTH,
    "sha512"
  );
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

/**
 * Descriptografa uma senha criptografada
 * @param encryptedPassword - Senha criptografada em base64
 * @returns Senha em texto plano
 */
export function decryptPassword(encryptedPassword: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedPassword, "base64");

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(
    key,
    salt,
    100_000,
    KEY_LENGTH,
    "sha512"
  );
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final("utf8");
}
