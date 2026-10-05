/**
 * Tennis Tracker Main Application
 */
import { tennisStore } from "./data-store.js";
import { firebaseManager } from "./firebase-config.js";

// DOM要素の参照
const elements = {
  // Navigation Tabs
  navTabs: document.querySelectorAll("[data-category]"),
  currentCategoryTitle: document.getElementById("current-category-title"),
  currentCategoryDesc: document.getElementById("current-category-desc"),
  totalCountBadge: document.getElementById("total-count-badge"),
  
  // Controls
  searchInput: document.getElementById("search-input"),
  clearSearchBtn: document.getElementById("clear-search-btn"),
  japanToggleBtn: document.getElementById("japan-toggle-btn"),
  sortSelect: document.getElementById("sort-select"),
  viewModeCardBtn: document.getElementById("view-mode-card"),
  viewModeTableBtn: document.getElementById("view-mode-table"),
  
  // Views
  cardContainer: document.getElementById("player-card-container"),
  tableContainer: document.getElementById("player-table-container"),
  tableBody: document.getElementById("player-table-body"),
  tournamentsContainer: document.getElementById("tournaments-container"),
  emptyState: document.getElementById("empty-state"),
  
  // Player Detail Modal
  playerModal: document.getElementById("player-modal"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalCloseBtn: document.getElementById("modal-close-btn"),
  modalPrevBtn: document.getElementById("modal-prev-btn"),
  modalNextBtn: document.getElementById("modal-next-btn"),
  modalPlayerContent: document.getElementById("modal-player-content"),

  // Firebase Config Modal
  firebaseModal: document.getElementById("firebase-modal"),
  firebaseBtn: document.getElementById("firebase-btn"),
  firebaseCloseBtn: document.getElementById("firebase-close-btn"),
  firebaseForm: document.getElementById("firebase-form"),
  firebaseStatusIndicator: document.getElementById("firebase-status-indicator"),
  firebaseStatusText: document.getElementById("firebase-status-text"),
  syncToFirestoreBtn: document.getElementById("sync-to-firestore-btn"),
  exportJsonBtn: document.getElementById("export-json-btn"),
  resetDataBtn: document.getElementById("reset-data-btn")
};

let currentViewMode = "card"; // 'card' or 'table'
let currentActivePlayerIndex = -1;
let currentFilteredList = [];

// 初期化
async function initApp() {
  setupEventListeners();
  updateFirebaseStatusBadge();
  
  // データストア初期化
  await tennisStore.init();
  updateCategoryView();
}

// イベントリスナーの設定
function setupEventListeners() {
  // カテゴリタブ切り替え
  elements.navTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const cat = tab.getAttribute("data-category");
      setCategory(cat);
    });
  });

  // 日本勢トグル
  elements.japanToggleBtn.addEventListener("click", () => {
    tennisStore.onlyJapanese = !tennisStore.onlyJapanese;
    updateJapanToggleUI();
    renderContent();
  });

  // 検索入力
  elements.searchInput.addEventListener("input", (e) => {
    tennisStore.searchQuery = e.target.value;
    if (elements.clearSearchBtn) {
      elements.clearSearchBtn.classList.toggle("hidden", !e.target.value);
    }
    renderContent();
  });

  // 検索クリア
  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener("click", () => {
      elements.searchInput.value = "";
      tennisStore.searchQuery = "";
      elements.clearSearchBtn.classList.add("hidden");
      renderContent();
    });
  }

  // ソート選択
  elements.sortSelect.addEventListener("change", (e) => {
    tennisStore.sortBy = e.target.value;
    renderContent();
  });

  // 表示モード切り替え
  elements.viewModeCardBtn.addEventListener("click", () => setViewMode("card"));
  elements.viewModeTableBtn.addEventListener("click", () => setViewMode("table"));

  // ==========================================
  // モーダル操作（ESCキー & 背景クリック & ×ボタン）
  // ==========================================
  // 1. ESCキーで閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!elements.playerModal.classList.contains("hidden")) {
        closePlayerModal();
      }
      if (!elements.firebaseModal.classList.contains("hidden")) {
        closeFirebaseModal();
      }
    } else if (e.key === "ArrowLeft" && !elements.playerModal.classList.contains("hidden")) {
      navigatePlayer(-1);
    } else if (e.key === "ArrowRight" && !elements.playerModal.classList.contains("hidden")) {
      navigatePlayer(1);
    }
  });

  // 2. モーダル外（背景・オーバーレイ）のクリックで閉じる
  elements.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === elements.modalBackdrop) {
      closePlayerModal();
    }
  });

  // 3. 閉じるボタン
  elements.modalCloseBtn.addEventListener("click", closePlayerModal);

  // 4. 前後ナビゲーション
  elements.modalPrevBtn.addEventListener("click", () => navigatePlayer(-1));
  elements.modalNextBtn.addEventListener("click", () => navigatePlayer(1));

  // Firebaseモーダル開閉
  elements.firebaseBtn.addEventListener("click", openFirebaseModal);
  elements.firebaseCloseBtn.addEventListener("click", closeFirebaseModal);
  elements.firebaseModal.addEventListener("click", (e) => {
    if (e.target === elements.firebaseModal) closeFirebaseModal();
  });

  // Firebase設定の保存
  elements.firebaseForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const config = {
      apiKey: document.getElementById("fb-apiKey").value.trim(),
      authDomain: document.getElementById("fb-authDomain").value.trim(),
      projectId: document.getElementById("fb-projectId").value.trim(),
      storageBucket: document.getElementById("fb-storageBucket").value.trim(),
      messagingSenderId: document.getElementById("fb-messagingSenderId").value.trim(),
      appId: document.getElementById("fb-appId").value.trim()
    };
    firebaseManager.saveConfig(config);
    alert("Firebase設定をローカルに保存しました。再接続を試みます。");
    await tennisStore.init();
    updateFirebaseStatusBadge();
    closeFirebaseModal();
    renderContent();
  });

  // Firestoreへの一括シード
  elements.syncToFirestoreBtn.addEventListener("click", async () => {
    if (!confirm("現在のデータをFirebase Firestoreへ一括アップロード（シード）しますか？")) return;
    try {
      elements.syncToFirestoreBtn.disabled = true;
      elements.syncToFirestoreBtn.textContent = "同期中...";
      const count = await tennisStore.syncAllToFirestore();
      alert(`✅ 完了！ 合計 ${count} 件のデータをFirestoreに同期しました。`);
    } catch (err) {
      alert("❌ 同期に失敗しました: " + err.message);
    } finally {
      elements.syncToFirestoreBtn.disabled = false;
      elements.syncToFirestoreBtn.textContent = "🚀 現在のデータをFirestoreに一括保存 (シード)";
    }
  });

  // JSONエクスポート
  elements.exportJsonBtn.addEventListener("click", () => {
    tennisStore.exportCategoryJson(tennisStore.currentCategory);
  });

  // データリセット
  elements.resetDataBtn.addEventListener("click", async () => {
    if (confirm("ローカルの変更を破棄して、初期JSONデータに戻しますか？")) {
      await tennisStore.resetToDefault();
      renderContent();
      alert("データを初期化しました。");
    }
  });
}

// カテゴリ切り替え
function setCategory(categoryKey) {
  tennisStore.currentCategory = categoryKey;
  
  // タブの見た目更新
  elements.navTabs.forEach(tab => {
    const isCurrent = tab.getAttribute("data-category") === categoryKey;
    if (isCurrent) {
      tab.classList.add("bg-emerald-800", "text-white", "shadow-sm");
      tab.classList.remove("text-emerald-100", "hover:bg-emerald-800/60");
    } else {
      tab.classList.remove("bg-emerald-800", "text-white", "shadow-sm");
      tab.classList.add("text-emerald-100", "hover:bg-emerald-800/60");
    }
  });

  updateCategoryView();
}

function updateCategoryView() {
  const cat = tennisStore.currentCategory;
  const isTournaments = cat === "tournaments";

  // タイトルと説明
  const catInfo = {
    atp_singles: {
      title: "男子シングルス (ATP)",
      desc: "世界のトップ100位および日本のトップ20選手。新世代シナー、アルカラスからジョコビッチ、錦織圭・西岡良仁・坂本怜など日本勢の戦況。"
    },
    wta_singles: {
      title: "女子シングルス (WTA)",
      desc: "世界のトップ100位および日本のトップ20選手。女王サバレンカ、シフィオンテク、ガウフから大坂なおみ、内島萌夏など躍動する女子テニス。"
    },
    atp_doubles: {
      title: "男子ダブルス (ATP)",
      desc: "世界トップランカーと日本を代表するスペシャリスト（マクラクラン勉、松井俊英など）。"
    },
    wta_doubles: {
      title: "女子ダブルス (WTA)",
      desc: "世界の頂点と、四大大会・五輪で数々の快挙を打ち立ててきた日本女子ダブルス黄金世代（青山・柴原・加藤・二宮・穂積）。"
    },
    wheelchair: {
      title: "車いすテニス (Open Division)",
      desc: "パリパラリンピック単複2冠の小田凱人・上地結衣をはじめ、世界トップ30位前後の男子・女子・クァードのスター選手。"
    },
    tournaments: {
      title: "四大大会 (グランドスラム)",
      desc: "全豪・全仏・ウィンブルドン・全米オープンの特徴、サーフェス、近年の歴代優勝者と見どころ。"
    }
  };

  const info = catInfo[cat] || { title: "テニスランキング", desc: "" };
  elements.currentCategoryTitle.textContent = info.title;
  elements.currentCategoryDesc.textContent = info.desc;

  // 四大大会ビューの切り替え
  if (isTournaments) {
    elements.tournamentsContainer.classList.remove("hidden");
    elements.cardContainer.classList.add("hidden");
    elements.tableContainer.classList.add("hidden");
    elements.japanToggleBtn.classList.add("hidden");
    elements.sortSelect.classList.add("hidden");
    elements.viewModeCardBtn.classList.add("hidden");
    elements.viewModeTableBtn.classList.add("hidden");
  } else {
    elements.tournamentsContainer.classList.add("hidden");
    elements.japanToggleBtn.classList.remove("hidden");
    elements.sortSelect.classList.remove("hidden");
    elements.viewModeCardBtn.classList.remove("hidden");
    elements.viewModeTableBtn.classList.remove("hidden");
    setViewMode(currentViewMode);
  }

  renderContent();
}

function setViewMode(mode) {
  currentViewMode = mode;
  if (tennisStore.currentCategory === "tournaments") return;

  if (mode === "card") {
    elements.cardContainer.classList.remove("hidden");
    elements.tableContainer.classList.add("hidden");
    elements.viewModeCardBtn.classList.add("bg-emerald-600", "text-white");
    elements.viewModeCardBtn.classList.remove("bg-white", "text-slate-600");
    elements.viewModeTableBtn.classList.add("bg-white", "text-slate-600");
    elements.viewModeTableBtn.classList.remove("bg-emerald-600", "text-white");
  } else {
    elements.cardContainer.classList.add("hidden");
    elements.tableContainer.classList.remove("hidden");
    elements.viewModeTableBtn.classList.add("bg-emerald-600", "text-white");
    elements.viewModeTableBtn.classList.remove("bg-white", "text-slate-600");
    elements.viewModeCardBtn.classList.add("bg-white", "text-slate-600");
    elements.viewModeCardBtn.classList.remove("bg-emerald-600", "text-white");
  }
}

function updateJapanToggleUI() {
  if (tennisStore.onlyJapanese) {
    elements.japanToggleBtn.classList.add("bg-red-600", "text-white", "border-red-600");
    elements.japanToggleBtn.classList.remove("bg-white", "text-slate-700", "border-slate-300");
    elements.japanToggleBtn.innerHTML = `<span>🇯🇵</span> <span class="font-bold">日本勢のみ表示中</span>`;
  } else {
    elements.japanToggleBtn.classList.remove("bg-red-600", "text-white", "border-red-600");
    elements.japanToggleBtn.classList.add("bg-white", "text-slate-700", "border-slate-300");
    elements.japanToggleBtn.innerHTML = `<span>🇯🇵</span> <span>日本勢トップ</span>`;
  }
}

// コンテンツの描画
function renderContent() {
  const cat = tennisStore.currentCategory;
  if (cat === "tournaments") {
    renderTournaments();
    return;
  }

  currentFilteredList = tennisStore.getFilteredData(cat);
  elements.totalCountBadge.textContent = `${currentFilteredList.length} 選手`;

  if (currentFilteredList.length === 0) {
    elements.emptyState.classList.remove("hidden");
    elements.cardContainer.classList.add("hidden");
    elements.tableContainer.classList.add("hidden");
    return;
  }

  elements.emptyState.classList.add("hidden");
  if (currentViewMode === "card") {
    elements.cardContainer.classList.remove("hidden");
    renderCards(currentFilteredList);
  } else {
    elements.tableContainer.classList.remove("hidden");
    renderTable(currentFilteredList);
  }
}

// カードビュー描画
function renderCards(players) {
  elements.cardContainer.innerHTML = "";
  players.forEach((p, idx) => {
    const card = document.createElement("div");
    card.className = `player-card bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 cursor-pointer relative hover:border-emerald-500 flex flex-col justify-between ${p.isJapanese ? 'japan-highlight' : ''}`;
    
    // 順位バッジ色
    let rankBadgeClass = "bg-slate-100 text-slate-700";
    if (p.rank === 1) rankBadgeClass = "rank-badge-top1";
    else if (p.rank <= 3) rankBadgeClass = "rank-badge-top3";
    else if (p.rank <= 10) rankBadgeClass = "rank-badge-top10";

    card.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center justify-center font-bold text-sm px-2.5 py-1 rounded-full ${rankBadgeClass}">
              #${p.rank}
            </span>
            ${p.division ? `<span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${p.division}</span>` : ''}
            ${p.isJapanese ? `<span class="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">🇯🇵 日本</span>` : ''}
          </div>
          <span class="text-xs font-semibold text-slate-400 font-mono">${p.points ? `${p.points.toLocaleString()} pts` : ''}</span>
        </div>

        <div class="flex items-baseline gap-2 mb-1">
          <span class="text-xl">${p.flag || '🏳️'}</span>
          <h3 class="text-lg font-bold text-slate-900 group-hover:text-emerald-700 leading-tight">
            ${p.nameJa || p.name}
          </h3>
        </div>
        <div class="text-xs text-slate-500 font-medium mb-3">
          ${p.name} (${p.countryJa || p.country})
        </div>

        <!-- 昔のファン向けワンフレーズ紹介 -->
        <p class="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          ${p.bioSummary || 'プロツアーで活躍するトップテニスプレーヤー。'}
        </p>
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div>
          <span class="text-slate-400">年齢:</span> <span class="font-medium text-slate-700">${p.age || '-'}歳</span>
          ${p.careerHigh ? `<span class="mx-1 text-slate-300">|</span><span class="text-slate-400">最高:</span> <span class="font-medium text-slate-700">${p.careerHigh}位</span>` : ''}
        </div>
        <span class="text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
          詳細を見る <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
      </div>
    `;

    card.addEventListener("click", () => openPlayerModal(idx));
    elements.cardContainer.appendChild(card);
  });
}

// テーブルビュー描画
function renderTable(players) {
  elements.tableBody.innerHTML = "";
  players.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.className = `hover:bg-emerald-50/50 cursor-pointer border-b border-slate-100 transition-colors ${p.isJapanese ? 'bg-red-50/40' : ''}`;
    
    let rankBadgeClass = "bg-slate-100 text-slate-700";
    if (p.rank === 1) rankBadgeClass = "rank-badge-top1";
    else if (p.rank <= 3) rankBadgeClass = "rank-badge-top3";
    else if (p.rank <= 10) rankBadgeClass = "rank-badge-top10";

    tr.innerHTML = `
      <td class="py-3 px-4">
        <span class="inline-flex items-center justify-center font-bold text-xs px-2.5 py-1 rounded-full ${rankBadgeClass}">
          #${p.rank}
        </span>
      </td>
      <td class="py-3 px-4">
        <div class="flex items-center gap-2">
          <span class="text-lg">${p.flag || '🏳️'}</span>
          <div>
            <div class="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              ${p.nameJa || p.name}
              ${p.isJapanese ? '<span class="text-[10px] text-red-600 bg-red-100 font-bold px-1.5 py-0.2 rounded">JP</span>' : ''}
            </div>
            <div class="text-xs text-slate-400 font-normal">${p.name}</div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 text-xs text-slate-600">${p.countryJa || p.country}</td>
      <td class="py-3 px-4 text-right font-mono text-xs font-semibold text-slate-700">
        ${p.points ? p.points.toLocaleString() : '-'}
      </td>
      <td class="py-3 px-4 text-center text-xs text-slate-600">${p.age || '-'}</td>
      <td class="py-3 px-4 text-center text-xs text-slate-600 font-medium">${p.careerHigh ? `${p.careerHigh}位` : '-'}</td>
      <td class="py-3 px-4 text-xs text-slate-500 max-w-xs truncate hidden md:table-cell">
        ${p.style || p.bioSummary || '-'}
      </td>
      <td class="py-3 px-4 text-right">
        <button class="text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1 rounded hover:bg-emerald-100">
          詳細
        </button>
      </td>
    `;

    tr.addEventListener("click", () => openPlayerModal(idx));
    elements.tableBody.appendChild(tr);
  });
}

// 四大大会ビュー描画
function renderTournaments() {
  const tournaments = tennisStore.categories.tournaments.data;
  elements.totalCountBadge.textContent = `${tournaments.length} 大会`;
  elements.tournamentsContainer.innerHTML = "";

  const slamClassMap = {
    "australian-open": "slam-ao",
    "french-open": "slam-rg",
    "wimbledon": "slam-wb",
    "us-open": "slam-us"
  };

  tournaments.forEach(t => {
    const card = document.createElement("div");
    const accentClass = slamClassMap[t.id] || "border-t-4 border-slate-500";
    card.className = `bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 ${accentClass}`;

    let championsHtml = "";
    if (t.recentChampions && t.recentChampions.length > 0) {
      championsHtml = `
        <div class="mt-4 pt-4 border-t border-slate-100">
          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">近年の歴代優勝者</h4>
          <div class="space-y-2">
            ${t.recentChampions.map(c => `
              <div class="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span class="font-bold text-emerald-700 mr-2">${c.year}年:</span>
                <span class="text-slate-800 mr-3"><strong>男子:</strong> ${c.men}</span>
                <span class="text-slate-800 mr-3"><strong>女子:</strong> ${c.women}</span>
                ${c.wheelchairMen ? `<div class="mt-1 text-[11px] text-slate-600">♿ <strong>車いす:</strong> 男子: ${c.wheelchairMen} / 女子: ${c.wheelchairWomen}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex items-start justify-between mb-3">
        <div>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">${t.month}</span>
          <h3 class="text-xl font-bold text-slate-900 mt-1">${t.nameJa}</h3>
          <div class="text-xs text-slate-400 font-medium">${t.name}</div>
        </div>
        <span class="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">${t.surface}</span>
      </div>

      <div class="text-xs text-slate-500 mb-2 flex items-center gap-1">
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        ${t.city} (${t.venue})
      </div>

      <p class="text-xs text-slate-600 leading-relaxed mb-3">
        ${t.description}
      </p>

      ${championsHtml}
    `;

    elements.tournamentsContainer.appendChild(card);
  });
}

// ==========================================
// 選手詳細モーダル（ポップアップ）制御
// ==========================================
function openPlayerModal(index) {
  if (index < 0 || index >= currentFilteredList.length) return;
  currentActivePlayerIndex = index;
  const p = currentFilteredList[index];

  // 前後ボタンの有効/無効化
  elements.modalPrevBtn.disabled = index === 0;
  elements.modalNextBtn.disabled = index === currentFilteredList.length - 1;

  // モーダル内容の生成
  let grandSlamHtml = "";
  if (p.grandSlams) {
    grandSlamHtml = `
      <div class="mt-4 pt-4 border-t border-slate-100">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>🏆</span> 四大大会 (グランドスラム) の戦績
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div class="bg-sky-50 border border-sky-100 p-2 rounded-lg">
            <div class="text-[10px] text-sky-700 font-bold">全豪オープン</div>
            <div class="font-semibold text-slate-800 mt-0.5">${p.grandSlams.australianOpen || '-'}</div>
          </div>
          <div class="bg-orange-50 border border-orange-100 p-2 rounded-lg">
            <div class="text-[10px] text-orange-700 font-bold">全仏オープン</div>
            <div class="font-semibold text-slate-800 mt-0.5">${p.grandSlams.frenchOpen || '-'}</div>
          </div>
          <div class="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
            <div class="text-[10px] text-emerald-700 font-bold">ウィンブルドン</div>
            <div class="font-semibold text-slate-800 mt-0.5">${p.grandSlams.wimbledon || '-'}</div>
          </div>
          <div class="bg-indigo-50 border border-indigo-100 p-2 rounded-lg">
            <div class="text-[10px] text-indigo-700 font-bold">全米オープン</div>
            <div class="font-semibold text-slate-800 mt-0.5">${p.grandSlams.usOpen || '-'}</div>
          </div>
        </div>
      </div>
    `;
  }

  let recentFormHtml = "";
  if (p.recentForm && p.recentForm.length > 0) {
    recentFormHtml = `
      <div class="mt-4 pt-4 border-t border-slate-100">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span>📈</span> 近年の主なタイトル・ハイライト
        </h4>
        <div class="space-y-1.5">
          ${p.recentForm.map(rf => `
            <div class="text-xs bg-slate-50 border border-slate-100 p-2 rounded-md flex items-center justify-between">
              <div>
                <span class="font-bold text-emerald-700 mr-1.5">${rf.year}</span>
                <span class="font-medium text-slate-800">${rf.tournament}</span>
              </div>
              <span class="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">${rf.result}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  elements.modalPlayerContent.innerHTML = `
    <div>
      <!-- ヘッダー情報 -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="font-bold text-sm bg-emerald-700 text-white px-2.5 py-0.5 rounded-full">
              世界ランク #${p.rank}
            </span>
            ${p.division ? `<span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${p.division}</span>` : ''}
            ${p.isJapanese ? `<span class="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">🇯🇵 日本代表</span>` : ''}
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl">${p.flag || '🏳️'}</span>
            <h2 class="text-2xl font-bold text-slate-900">${p.nameJa || p.name}</h2>
          </div>
          <div class="text-sm text-slate-500 font-medium">
            ${p.name} / ${p.countryJa || p.country}
          </div>
        </div>

        <div class="text-right">
          <div class="text-xs text-slate-400">獲得ポイント</div>
          <div class="text-xl font-bold text-slate-800 font-mono">${p.points ? `${p.points.toLocaleString()} pts` : '-'}</div>
        </div>
      </div>

      <!-- 昔のファンに向けた選手ガイド解説 -->
      <div class="mt-4 bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-xl">
        <div class="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
          <span>🎾</span> 選手の特徴・見どころガイド (昔のファン向け解説)
        </div>
        <p class="text-sm text-emerald-950 leading-relaxed">
          ${p.bioSummary || '世界ツアーで活躍するトップテニスプレーヤー。'}
        </p>
      </div>

      <!-- 基本プロフィール表 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div class="text-slate-400">年齢</div>
          <div class="font-bold text-slate-800 text-sm mt-0.5">${p.age ? `${p.age} 歳` : '-'}</div>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div class="text-slate-400">身長</div>
          <div class="font-bold text-slate-800 text-sm mt-0.5">${p.height || '-'}</div>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div class="text-slate-400">利き手</div>
          <div class="font-bold text-slate-800 text-sm mt-0.5">${p.plays || '-'}</div>
        </div>
        <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div class="text-slate-400">自己最高位</div>
          <div class="font-bold text-slate-800 text-sm mt-0.5">${p.careerHigh ? `${p.careerHigh} 位` : '-'}</div>
        </div>
      </div>

      <!-- プレースタイル -->
      ${p.style ? `
        <div class="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
          <span class="font-bold text-slate-700 mr-2">プレースタイル:</span>
          <span class="text-slate-600">${p.style}</span>
        </div>
      ` : ''}

      <!-- パートナー情報（ダブルスの場合） -->
      ${p.partner ? `
        <div class="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs">
          <span class="font-bold text-amber-900 mr-2">主なダブルスペア:</span>
          <span class="text-amber-800 font-medium">${p.partnerJa || p.partner}</span>
        </div>
      ` : ''}

      <!-- 四大大会戦績 -->
      ${grandSlamHtml}

      <!-- 近年のハイライト -->
      ${recentFormHtml}
    </div>
  `;

  // モーダル表示
  elements.playerModal.classList.remove("hidden");
  setTimeout(() => {
    elements.playerModal.classList.add("modal-active");
  }, 10);
  document.body.style.overflow = "hidden"; // 背景スクロール禁止
}

function closePlayerModal() {
  elements.playerModal.classList.remove("modal-active");
  setTimeout(() => {
    elements.playerModal.classList.add("hidden");
    document.body.style.overflow = "";
  }, 150);
}

function navigatePlayer(direction) {
  const nextIndex = currentActivePlayerIndex + direction;
  if (nextIndex >= 0 && nextIndex < currentFilteredList.length) {
    openPlayerModal(nextIndex);
  }
}

// ==========================================
// Firebase設定モーダル制御
// ==========================================
function openFirebaseModal() {
  const cfg = firebaseManager.loadConfig();
  document.getElementById("fb-apiKey").value = cfg.apiKey || "";
  document.getElementById("fb-authDomain").value = cfg.authDomain || "";
  document.getElementById("fb-projectId").value = cfg.projectId || "";
  document.getElementById("fb-storageBucket").value = cfg.storageBucket || "";
  document.getElementById("fb-messagingSenderId").value = cfg.messagingSenderId || "";
  document.getElementById("fb-appId").value = cfg.appId || "";

  elements.firebaseModal.classList.remove("hidden");
}

function closeFirebaseModal() {
  elements.firebaseModal.classList.add("hidden");
}

function updateFirebaseStatusBadge() {
  if (firebaseManager.hasValidConfig() && firebaseManager.isInitialized) {
    elements.firebaseStatusIndicator.className = "w-2.5 h-2.5 rounded-full bg-emerald-400";
    elements.firebaseStatusText.textContent = "Firestore 接続中";
  } else {
    elements.firebaseStatusIndicator.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
    elements.firebaseStatusText.textContent = "ローカルJSONモード (Firebase未設定)";
  }
}

// アプリ起動
window.addEventListener("DOMContentLoaded", initApp);
