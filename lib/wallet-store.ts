/**
 * Wallet Store — IndexedDB-based encrypted wallet storage.
 *
 * Private keys are encrypted with a device-specific key derived from
 * a passphrase before being stored. They NEVER leave the browser.
 *
 * Structure:
 * - wallets: { address, encryptedPrivateKey, iv, salt, username, createdAt }
 * - activeSession: { address } (cleared on disconnect, NOT on delete)
 */

const DB_NAME = "court-of-agents-wallet";
const DB_VERSION = 1;
const WALLET_STORE = "wallets";
const SESSION_STORE = "session";

export interface StoredWallet {
  address: string;
  encryptedPrivateKey: string;
  iv: string;
  salt: string;
  username: string;
  createdAt: string;
}

export interface ActiveSession {
  id: "active";
  address: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(WALLET_STORE)) {
        db.createObjectStore(WALLET_STORE, { keyPath: "address" });
      }
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ─── Encryption helpers ───

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || [];
  return new Uint8Array(bytes);
}

export async function encryptPrivateKey(
  privateKey: string,
  passphrase: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(privateKey)
  );
  return {
    encrypted: bufToHex(encrypted),
    iv: bufToHex(iv),
    salt: bufToHex(salt),
  };
}

export async function decryptPrivateKey(
  encrypted: string,
  iv: string,
  salt: string,
  passphrase: string
): Promise<string> {
  const key = await deriveKey(passphrase, hexToBuf(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBuf(iv) },
    key,
    hexToBuf(encrypted)
  );
  return new TextDecoder().decode(decrypted);
}

// ─── Wallet CRUD ───

export async function saveWallet(wallet: StoredWallet): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WALLET_STORE, "readwrite");
    tx.objectStore(WALLET_STORE).put(wallet);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWallet(address: string): Promise<StoredWallet | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WALLET_STORE, "readonly");
    const request = tx.objectStore(WALLET_STORE).get(address.toLowerCase());
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllWallets(): Promise<StoredWallet[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WALLET_STORE, "readonly");
    const request = tx.objectStore(WALLET_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteWallet(address: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WALLET_STORE, "readwrite");
    tx.objectStore(WALLET_STORE).delete(address.toLowerCase());
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Session (active wallet) ───

export async function setActiveSession(address: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    tx.objectStore(SESSION_STORE).put({ id: "active", address: address.toLowerCase() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getActiveSession(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readonly");
    const request = tx.objectStore(SESSION_STORE).get("active");
    request.onsuccess = () => resolve(request.result?.address || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearActiveSession(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SESSION_STORE, "readwrite");
    tx.objectStore(SESSION_STORE).delete("active");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
