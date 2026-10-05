/**
 * Tennis Data Store
 * Handles data fetching, caching, filtering, searching, and synchronization with Firestore or Local JSON.
 */
import { firebaseManager } from "./firebase-config.js";

class TennisDataStore {
  constructor() {
    this.categories = {
      atp_singles: { file: "players_atp_singles.json", name: "男子シングルス (ATP)", data: [] },
      wta_singles: { file: "players_wta_singles.json", name: "女子シングルス (WTA)", data: [] },
      atp_doubles: { file: "players_atp_doubles.json", name: "男子ダブルス (ATP)", data: [] },
      wta_doubles: { file: "players_wta_doubles.json", name: "女子ダブルス (WTA)", data: [] },
      wheelchair: { file: "players_wheelchair.json", name: "車いすテニス (Open)", data: [] },
      tournaments: { file: "tournaments.json", name: "四大大会 (グランドスラム)", data: [] }
    };
    this.currentCategory = "atp_singles";
    this.onlyJapanese = false;
    this.searchQuery = "";
    this.sortBy = "rank_asc"; // rank_asc, rank_desc, points_desc, age_asc, name_asc
    this.dataSource = "local"; // 'local' or 'firebase'
  }

  async init() {
    const fbReady = await firebaseManager.initialize();
    this.dataSource = fbReady ? "firebase" : "local";
    await this.loadAllCategories();
  }

  async loadAllCategories() {
    const keys = Object.keys(this.categories);
    for (const key of keys) {
      await this.loadCategory(key);
    }
  }

  async loadCategory(categoryKey) {
    if (!this.categories[categoryKey]) return [];

    // 1. Firebaseが接続されている場合はFirestoreから読み込みを試みる
    if (this.dataSource === "firebase") {
      try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const db = firebaseManager.getDb();
        if (db) {
          const colRef = collection(db, categoryKey);
          const snapshot = await getDocs(colRef);
          if (!snapshot.empty) {
            const list = [];
            snapshot.forEach((doc) => {
              list.push({ id: doc.id, ...doc.data() });
            });
            this.categories[categoryKey].data = list;
            console.log(`Loaded ${list.length} items from Firestore for ${categoryKey}`);
            return list;
          }
        }
      } catch (err) {
        console.warn(`Firestore read failed for ${categoryKey}, falling back to local JSON:`, err);
      }
    }

    // 2. ローカルキャッシュ (localStorage) の確認
    const localKey = `tennis_data_${categoryKey}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.categories[categoryKey].data = parsed;
          return parsed;
        }
      } catch (e) {
        console.warn("Error parsing cached data", e);
      }
    }

    // 3. 静的JSONファイルからフェッチ
    try {
      const fileName = this.categories[categoryKey].file;
      const dataUrl = new URL(`../data/${fileName}?t=${Date.now()}`, import.meta.url).href;
      const res = await fetch(dataUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.categories[categoryKey].data = data;
      // ローカルストレージに初期キャッシュ
      localStorage.setItem(localKey, JSON.stringify(data));
      return data;
    } catch (e) {
      console.error(`Failed to load ${categoryKey} JSON file:`, e);
      return [];
    }
  }

  getFilteredData(categoryKey = this.currentCategory) {
    if (!this.categories[categoryKey]) return [];
    let list = [...this.categories[categoryKey].data];

    // 四大大会の場合は検索のみ
    if (categoryKey === "tournaments") {
      if (!this.searchQuery) return list;
      const q = this.searchQuery.toLowerCase();
      return list.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.nameJa && t.nameJa.toLowerCase().includes(q)) ||
        (t.surface && t.surface.toLowerCase().includes(q))
      );
    }

    // 日本勢フィルター
    if (this.onlyJapanese) {
      list = list.filter(p => p.isJapanese === true || p.country === "JPN");
    }

    // 検索フィルター（英語名、日本語名、国名）
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p => {
        const matchName = p.name && p.name.toLowerCase().includes(q);
        const matchNameJa = p.nameJa && p.nameJa.toLowerCase().includes(q);
        const matchCountry = (p.country && p.country.toLowerCase().includes(q)) || 
                             (p.countryJa && p.countryJa.toLowerCase().includes(q));
        const matchBio = p.bioSummary && p.bioSummary.toLowerCase().includes(q);
        const matchStyle = p.style && p.style.toLowerCase().includes(q);
        return matchName || matchNameJa || matchCountry || matchBio || matchStyle;
      });
    }

    // ソート
    list.sort((a, b) => {
      switch (this.sortBy) {
        case "rank_asc":
          return (a.rank || 9999) - (b.rank || 9999);
        case "rank_desc":
          return (b.rank || 0) - (a.rank || 0);
        case "points_desc":
          return (b.points || 0) - (a.points || 0);
        case "age_asc":
          return (a.age || 99) - (b.age || 99);
        case "name_asc":
          return (a.nameJa || a.name || "").localeCompare(b.nameJa || b.name || "", "ja");
        default:
          return (a.rank || 9999) - (b.rank || 9999);
      }
    });

    return list;
  }

  getPlayerById(id, categoryKey = this.currentCategory) {
    if (!this.categories[categoryKey]) return null;
    return this.categories[categoryKey].data.find(p => p.id === id);
  }

  findPlayerAcrossAll(id) {
    for (const key of Object.keys(this.categories)) {
      const found = this.categories[key].data.find(p => p.id === id);
      if (found) return { player: found, category: key };
    }
    return null;
  }

  // 選手データのローカル更新
  updatePlayer(categoryKey, updatedPlayer) {
    if (!this.categories[categoryKey]) return false;
    const list = this.categories[categoryKey].data;
    const index = list.findIndex(p => p.id === updatedPlayer.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...updatedPlayer };
    } else {
      list.push(updatedPlayer);
    }
    // ローカルストレージに保存
    localStorage.setItem(`tennis_data_${categoryKey}`, JSON.stringify(list));
    return true;
  }

  // Firestoreへ現在保持している全データを一括アップロード（シード機能）
  async syncAllToFirestore() {
    if (!firebaseManager.isInitialized) {
      throw new Error("Firebaseが初期化されていません。先に設定を入力してください。");
    }
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const db = firebaseManager.getDb();
    const categories = Object.keys(this.categories);
    let totalSynced = 0;

    for (const catKey of categories) {
      const items = this.categories[catKey].data;
      for (const item of items) {
        const docId = item.id || `item_${item.rank || Math.random().toString(36).substring(7)}`;
        await setDoc(doc(db, catKey, docId), item, { merge: true });
        totalSynced++;
      }
    }
    return totalSynced;
  }

  // 現在のデータをJSONファイルとしてダウンロード
  exportCategoryJson(categoryKey) {
    if (!this.categories[categoryKey]) return;
    const data = this.categories[categoryKey].data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = this.categories[categoryKey].file;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 全カテゴリをリセット（元のJSONを再読込）
  async resetToDefault() {
    for (const key of Object.keys(this.categories)) {
      localStorage.removeItem(`tennis_data_${key}`);
    }
    await this.loadAllCategories();
  }
}

export const tennisStore = new TennisDataStore();
