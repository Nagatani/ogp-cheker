/**
 * 設定と定数
 */
const CONFIG = {
  SELECTORS: {
    ANALYZE_BTN: "analyzeBtn",
    URL_INPUT: "urlInput",
    RESULTS: "results",
    LOADING: "loading",
    ERROR_MSG: "errorMsg",
    PAGE_TITLE: "pageTitle",
    OGP_TABLE: "ogpTable",
    TWITTER_TABLE: "twitterTable",
    PREVIEW_TITLE: "previewTitle",
    PREVIEW_DESC: "previewDesc",
    PREVIEW_IMG: "previewImg",
    PREVIEW_HOST: "previewHost",
  },
  API_ENDPOINT: "/api/proxy",
};

const TAG_DESCRIPTIONS = {
  // OGP Basic
  "og:title": "ページのタイトル",
  "og:type": "ページの種類（website, articleなど）",
  "og:image": "SNSでシェアされた際に表示される画像URL",
  "og:url": "ページの正規URL",
  "og:description": "ページの概要・説明文",
  "og:site_name": "サイト名",
  "og:locale": "コンテンツの言語（ja_JPなど）",
  "og:determiner": "タイトルの前の冠詞（a, an, theなど）",
  "og:audio": "音声ファイルのURL",
  "og:video": "動画ファイルのURL",

  // OGP Optional - Image
  "og:image:url": "画像のURL（og:imageと同じ）",
  "og:image:secure_url": "画像のHTTPS URL",
  "og:image:type": "画像のMIMEタイプ（image/jpegなど）",
  "og:image:width": "画像の幅（ピクセル）",
  "og:image:height": "画像の高さ（ピクセル）",
  "og:image:alt": "画像の内容を説明する代替テキスト",

  // Facebook
  "fb:app_id": "FacebookアプリID（インサイト分析用）",
  "fb:admins": "Facebookページ管理者のID",

  // Twitter
  "twitter:card": "カードの種類（summary, summary_large_image）",
  "twitter:site": "サイトのTwitterアカウント（@username）",
  "twitter:creator": "コンテンツ制作者のTwitterアカウント",
  "twitter:title": "Twitter用のタイトル（OGPの代替）",
  "twitter:description": "Twitter用の説明文（OGPの代替）",
  "twitter:image": "Twitter用の画像（OGPの代替）",
  "twitter:image:alt": "Twitter用画像の代替テキスト",

  // Others
  "description": "検索エンジン用ページ説明",
  "keywords": "検索エンジン用キーワード",
  "author": "ページの著者",
  "application-name": "ウェブアプリの名前",
  "generator": "ページ生成ツール（WordPressなど）",
  "theme-color": "ブラウザのツールバー色など",
  "article:published_time": "記事の公開日時",
  "article:modified_time": "記事の更新日時",
  "article:section": "記事のセクション・カテゴリ",
  "article:tag": "記事のタグ",
  "article:author": "記事の著者プロフィールURL",
};

/**
 * UI操作を担当するモジュール
 */
/**
 * ネームスペース定義
 */
const NAMESPACE_INFO = {
  basic: { title: "基本情報", desc: "HTML標準のメタデータです。" },
  og: { title: "Open Graph Protocol", desc: "SNSでシェアされた際の表示を制御するためのプロトコルです。" },
  twitter: { title: "Twitter Card", desc: "Twitterでの表示を最適化するための設定です。" },
  fb: { title: "Facebook", desc: "Facebook連携やインサイト分析に使用されます。" },
  article: { title: "Article", desc: "記事の著者や公開日などの詳細情報です。" },
  product: { title: "Product", desc: "商品情報（価格、通貨など）を定義します。" },
  music: { title: "Music", desc: "音楽コンテンツ（曲、アルバムなど）の情報です。" },
  video: { title: "Video", desc: "動画コンテンツの情報です。" },
  book: { title: "Book", desc: "書籍の情報です。" },
  profile: { title: "Profile", desc: "人物プロフィールの情報です。" },
  al: { title: "App Links", desc: "アプリへのディープリンク情報です。" },
  other: { title: "その他", desc: "その他のメタデータです。" }
};

/**
 * UI操作を担当するモジュール
 */
const UI = {
  getEl(id) {
    return document.getElementById(id);
  },

  reset() {
    this.getEl(CONFIG.SELECTORS.RESULTS).style.display = "none";
    this.getEl(CONFIG.SELECTORS.ERROR_MSG).style.display = "none";
    const container = this.getEl("metaSections");
    if (container) container.innerHTML = "";
  },

  showLoading(show) {
    this.getEl(CONFIG.SELECTORS.LOADING).style.display = show ? "block" : "none";
    this.getEl(CONFIG.SELECTORS.ANALYZE_BTN).disabled = show;
  },

  showError(msg) {
    const el = this.getEl(CONFIG.SELECTORS.ERROR_MSG);
    el.innerText = msg;
    el.style.display = "block";
  },

  showResults() {
    this.getEl(CONFIG.SELECTORS.RESULTS).style.display = "grid";
  },

  // renderPageTitle removed

  renderSections(groupedData) {
    const container = this.getEl("metaSections");
    if (!container) return;
    container.innerHTML = "";

    // 優先順位で並び替え
    const priority = ["basic", "og", "twitter", "fb", "article", "product", "other"];
    const keys = Object.keys(groupedData).sort((a, b) => {
      const idxA = priority.indexOf(a);
      const idxB = priority.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    keys.forEach(ns => {
      const list = groupedData[ns];
      if (list.length === 0) return;

      const section = document.createElement("div");
      section.className = "meta-section";
      section.style.marginBottom = "2em";

      const info = NAMESPACE_INFO[ns] || NAMESPACE_INFO.other;

      const title = document.createElement("h3");
      title.innerText = info.title;
      section.appendChild(title);

      const desc = document.createElement("p");
      desc.innerText = info.desc;
      desc.style.fontSize = "0.9em";
      desc.style.color = "#666";
      desc.style.marginBottom = "10px";
      section.appendChild(desc);

      const table = document.createElement("table");
      this.renderTableContent(table, list);
      section.appendChild(table);

      container.appendChild(section);
    });
  },

  renderTableContent(table, data) {
    data.forEach(({ key, value }) => {
      const row = table.insertRow();

      // Key (Tooltip付き)
      const keyCell = row.insertCell(0);
      keyCell.innerText = key;
      keyCell.style.fontWeight = "bold";

      const desc = TAG_DESCRIPTIONS[key];
      if (desc) {
        keyCell.title = desc; // マウスオーバーで表示
        keyCell.style.cursor = "help"; // カーソルをヘルプ用に
        keyCell.style.textDecoration = "underline dotted"; // 視覚的なヒント
      }

      // Value
      const valueCell = row.insertCell(1);
      valueCell.innerText = value;
      valueCell.style.wordBreak = "break-all";

      if (key.includes("image") && (value.startsWith("http") || value.startsWith("data:"))) {
        const img = document.createElement("img");
        img.src = value;
        img.className = "table-img";
        // 最大幅をテーブル幅に合わせる
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.marginTop = "10px";

        img.onerror = () => { img.style.display = "none"; };
        valueCell.appendChild(img);
      }
    });
  },

  renderPreview(data, host) {
    this.getEl(CONFIG.SELECTORS.PREVIEW_TITLE).innerText = data.ogTitle || "No Title";
    this.getEl(CONFIG.SELECTORS.PREVIEW_DESC).innerText = data.ogDesc || "No description available.";

    const imgEl = this.getEl(CONFIG.SELECTORS.PREVIEW_IMG);
    if (data.ogImage) {
      imgEl.src = data.ogImage;
      imgEl.style.display = "block";
    } else {
      imgEl.style.display = "none";
    }

    this.getEl(CONFIG.SELECTORS.PREVIEW_HOST).innerText = host;
  }
};

/**
 * データ取得と解析を担当するモジュール
 */
const API = {
  async fetchUrl(targetUrl) {
    const apiUrl = `${CONFIG.API_ENDPOINT}?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.contents) throw new Error("HTMLを取得できませんでした");

    return { contents: data.contents, finalUrl: data.finalUrl };
  },

  parseHtml(htmlString) {
    const parser = new DOMParser();
    return parser.parseFromString(htmlString, "text/html");
  },

  resolveUrl(url, base) {
    try {
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  },

  extractData(doc, baseUrl) {
    const title = doc.querySelector("title")?.innerText || "No Title";

    const metaData = {
      ogTitle: title,
      ogDesc: "",
      ogImage: "",
      ogSite: "",
    };

    // グループ化用オブジェクト
    const groupedData = {
      basic: [],
      og: [],
      twitter: [],
      fb: [],
      article: [],
      product: [],
      music: [],
      video: [],
      book: [],
      profile: [],
      al: [],
      other: []
    };

    const metas = doc.querySelectorAll("meta");
    metas.forEach((meta) => {
      const property = meta.getAttribute("property");
      const name = meta.getAttribute("name");
      const content = meta.getAttribute("content");

      if (!content) return;

      // キーとして property または name を使用
      const key = property || name;
      if (!key) return;

      // 取得対象のプレフィックスと特定の名前
      const targetPrefixes = ["og:", "fb:", "article:", "product:", "music:", "video:", "book:", "profile:", "al:"];
      // viewportを追加
      const targetNames = ["description", "keywords", "author", "application-name", "generator", "theme-color", "viewport"];

      // Update: Using a unified approach.
      let namespace = "other";
      const parts = key.split(":");

      // Check for known prefixes
      if (parts.length > 1 && groupedData.hasOwnProperty(parts[0])) {
        namespace = parts[0];
      } else if (key.startsWith("twitter:")) {
        namespace = "twitter";
      } else if (targetNames.includes(key)) {
        namespace = "basic";
      } else {
        // 前方一致チェック (targetPrefixes)
        // しかし、今回は「すべて」を取得するため、このチェックで除外せず、そのまま "other" として扱う
        const isAllowedPrefix = targetPrefixes.some(prefix => key.startsWith(prefix));
        // もし特定のprefixを持っているがgroupedDataにない場合は "other" になる（既存ロジック通り）
      }

      // Re-map twitter if not caught by parts (twitter:card -> twitter)
      if (key.startsWith("twitter:")) namespace = "twitter";

      if (groupedData[namespace]) {
        groupedData[namespace].push({ key, value: content });
      } else {
        // If namespace not found in groupedData (e.g. dynamic key), fallback to other
        // or create new group? For now fallback to other is safer.
        groupedData.other.push({ key, value: content });
      }

      // Metadata extraction
      if (namespace === "og") {
        if (key === "og:title") metaData.ogTitle = content;
        if (key === "og:description") metaData.ogDesc = content;
        if (key === "og:image") metaData.ogImage = this.resolveUrl(content, baseUrl);
        if (key === "og:site_name") metaData.ogSite = content;
      }
      if (key === "description" && !metaData.ogDesc) metaData.ogDesc = content;

      if (namespace === "twitter") {
        if (!metaData.ogTitle && key === "twitter:title") metaData.ogTitle = content;
        if (!metaData.ogDesc && key === "twitter:description") metaData.ogDesc = content;
        if (!metaData.ogImage && key === "twitter:image") metaData.ogImage = this.resolveUrl(content, baseUrl);
      }
    });

    return { title, metaData, groupedData };
  }
};

/**
 * アプリケーションのメインロジック
 */
const App = {
  init() {
    const analyzeBtn = UI.getEl(CONFIG.SELECTORS.ANALYZE_BTN);
    const urlInput = UI.getEl(CONFIG.SELECTORS.URL_INPUT);

    // クエリパラメータからURLを取得して入力欄にセット
    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = searchParams.get("url");
    if (urlParam) {
      urlInput.value = urlParam;
    }

    // Enterキー対応
    urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") analyzeBtn.click();
    });

    analyzeBtn.addEventListener("click", () => this.analyze());
  },

  async analyze() {
    const urlInput = UI.getEl(CONFIG.SELECTORS.URL_INPUT);
    const targetUrl = urlInput.value.trim();

    UI.reset();

    if (!targetUrl) {
      UI.showError("URLを入力してください。");
      return;
    }

    UI.showLoading(true);

    try {
      const { contents, finalUrl } = await API.fetchUrl(targetUrl);
      const doc = API.parseHtml(contents);
      // リダイレクト先のURLがあればそれをベースURLとして使う
      const effectiveUrl = finalUrl || targetUrl;
      const { title, metaData, groupedData } = API.extractData(doc, effectiveUrl);

      // Page TitleをBasicの先頭に追加
      if (title && title !== "No Title") {
        groupedData.basic.unshift({ key: "Page Title", value: title });
      }

      UI.renderSections(groupedData);

      let host = "WEBSITE";
      try {
        // 最終的なURLのドメインを表示する
        host = new URL(effectiveUrl).hostname.toLowerCase();
      } catch (e) { /* ignore */ }

      UI.renderPreview(metaData, host);

      // 初期表示状態を解除
      document.body.classList.remove("initial");

      UI.showResults();

    } catch (err) {
      console.error(err);
      UI.showError(`エラーが発生しました: ${err.message}`);
    } finally {
      UI.showLoading(false);
    }
  }
};

// アプリケーション起動
document.addEventListener("DOMContentLoaded", () => App.init());

