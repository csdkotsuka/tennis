/**
 * Firebase Configuration & Firestore Manager
 * 
 * Connected to Firebase project: tennis-510714
 * Works seamlessly via both:
 * 1. Firebase JS SDK (when full config / apiKey is present)
 * 2. Firestore Direct REST API (with zero config needed in test mode)
 * 3. Local JSON fallback (if completely offline)
 */

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "tennis-510714.firebaseapp.com",
  projectId: "tennis-510714",
  storageBucket: "tennis-510714.firebasestorage.app",
  messagingSenderId: "",
  appId: ""
};

export function parseFirestoreDoc(doc) {
  if (!doc) return null;
  const docId = doc.name ? doc.name.split("/").pop() : "";
  const result = { id: docId };
  if (!doc.fields) return result;
  for (const [key, val] of Object.entries(doc.fields)) {
    result[key] = parseFirestoreValue(val);
  }
  return result;
}

export function parseFirestoreValue(v) {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return parseInt(v.integerValue, 10);
  if ("doubleValue" in v) return parseFloat(v.doubleValue);
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue?.values || []).map(parseFirestoreValue);
  if ("mapValue" in v) {
    const obj = {};
    for (const [k, subVal] of Object.entries(v.mapValue?.fields || {})) {
      obj[k] = parseFirestoreValue(subVal);
    }
    return obj;
  }
  return null;
}

export function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === "object") {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

class FirebaseManager {
  constructor() {
    this.isInitialized = false;
    this.mode = "none"; // 'sdk', 'rest', 'none'
    this.db = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem("tennis_tracker_firebase_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
      } catch (e) {
        console.warn("Failed to parse saved Firebase config", e);
      }
    }
    return { ...DEFAULT_FIREBASE_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("tennis_tracker_firebase_config", JSON.stringify(this.config));
  }

  clearConfig() {
    this.config = { ...DEFAULT_FIREBASE_CONFIG };
    localStorage.removeItem("tennis_tracker_firebase_config");
    this.isInitialized = false;
    this.mode = "none";
    this.db = null;
  }

  getProjectId() {
    return this.config.projectId || DEFAULT_FIREBASE_CONFIG.projectId;
  }

  async initialize() {
    const projectId = this.getProjectId();
    if (!projectId) {
      console.log("ℹ️ No Firebase Project ID configured. Running in Local JSON mode.");
      this.isInitialized = false;
      this.mode = "none";
      return false;
    }

    // 1. Try Firebase Web SDK if apiKey is present
    if (this.config.apiKey) {
      try {
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        this.app = initializeApp(this.config);
        this.db = getFirestore(this.app);
        this.isInitialized = true;
        this.mode = "sdk";
        console.log("✅ Firebase SDK successfully connected to project:", projectId);
        return true;
      } catch (err) {
        console.warn("Firebase SDK initialization failed, trying REST mode:", err);
      }
    }

    // 2. Test Firestore REST API connection
    try {
      const testUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/atp_singles?pageSize=1`;
      const res = await fetch(testUrl);
      if (res.ok) {
        this.isInitialized = true;
        this.mode = "rest";
        console.log("✅ Firestore REST connection verified for project:", projectId);
        return true;
      } else {
        console.warn(`Firestore REST test returned HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn("Firestore REST test failed:", e);
    }

    this.isInitialized = false;
    this.mode = "none";
    return false;
  }

  // REST API: コレクション取得
  async fetchCollection(collectionName) {
    const projectId = this.getProjectId();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=300`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Firestore REST error HTTP ${res.status}`);
    const data = await res.json();
    const docs = data.documents || [];
    return docs.map(parseFirestoreDoc);
  }

  // REST API: ドキュメント保存
  async saveDocument(collectionName, docId, data) {
    const projectId = this.getProjectId();
    const cleanId = encodeURIComponent((docId || `item_${Date.now()}`).replace(/\//g, "_"));
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${cleanId}`;
    
    const fields = {};
    for (const [k, v] of Object.entries(data)) {
      fields[k] = toFirestoreValue(v);
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore save error HTTP ${res.status}: ${errText}`);
    }
    return await res.json();
  }

  getDb() {
    return this.db;
  }
}

export const firebaseManager = new FirebaseManager();
