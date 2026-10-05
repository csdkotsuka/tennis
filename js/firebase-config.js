/**
 * Firebase Configuration & Connection Manager
 * 
 * Firebaseのアカウントが未作成でも、ローカルJSONからデータをロードするフォールバック機能付き。
 * 後からFirebaseコンソールでプロジェクトを作成し、設定情報を保存するだけでFirestore連動に切り替わります。
 */

// デフォルトのFirebase設定（後から管理画面やUI上で上書き可能）
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

class FirebaseManager {
  constructor() {
    this.isInitialized = false;
    this.db = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem("tennis_tracker_firebase_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn("Failed to parse saved Firebase config", e);
      }
    }
    return { ...DEFAULT_FIREBASE_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...newConfig };
    localStorage.setItem("tennis_tracker_firebase_config", JSON.stringify(this.config));
  }

  hasValidConfig() {
    return Boolean(this.config && this.config.apiKey && this.config.projectId);
  }

  async initialize() {
    if (!this.hasValidConfig()) {
      console.log("ℹ️ Firebase config is empty. Using Local JSON fallback mode.");
      this.isInitialized = false;
      return false;
    }

    try {
      // Firebase CDNから動的にインポート（ビルド不要で動作可能）
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

      this.app = initializeApp(this.config);
      this.db = getFirestore(this.app);
      this.isInitialized = true;
      console.log("✅ Firebase Firestore successfully initialized for project:", this.config.projectId);
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize Firebase:", error);
      this.isInitialized = false;
      return false;
    }
  }

  getDb() {
    return this.isInitialized ? this.db : null;
  }
}

export const firebaseManager = new FirebaseManager();
