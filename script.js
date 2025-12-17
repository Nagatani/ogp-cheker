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
    this.tableClear(CONFIG.SELECTORS.OGP_TABLE);
    this.tableClear(CONFIG.SELECTORS.TWITTER_TABLE);
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

  renderPageTitle(title) {
    this.getEl(CONFIG.SELECTORS.PAGE_TITLE).innerText = title;
  },

  tableClear(tableId) {
    this.getEl(tableId).innerHTML = "";
  },

  renderTable(tableId, data) {
    const table = this.getEl(tableId);
    if (!data || data.length === 0) {
      const type = tableId === CONFIG.SELECTORS.OGP_TABLE ? "OGP" : "Twitter";
      table.innerHTML = `<tr><td colspan="2">${type}設定なし</td></tr>`;
      return;
    }

    data.forEach(({ key, value }) => {
      const row = table.insertRow();
      row.insertCell(0).innerText = key;

      const cellValue = row.insertCell(1);
      cellValue.innerText = value;

      if (key.includes("image") && (value.startsWith("http") || value.startsWith("data:"))) {
        const img = document.createElement("img");
        img.src = value;
        img.className = "table-img";
        // エラー時のハンドリング（オプション）
        img.onerror = () => { img.style.display = "none"; };
        cellValue.appendChild(img);
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

    return data.contents;
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

    const ogpList = [];
    const twitterList = [];

    const metas = doc.querySelectorAll("meta");
    metas.forEach((meta) => {
      const property = meta.getAttribute("property");
      const name = meta.getAttribute("name");
      const content = meta.getAttribute("content");

      if (!content) return;

      // OGP
      if (property && property.startsWith("og:")) {
        ogpList.push({ key: property, value: content });

        if (property === "og:title") metaData.ogTitle = content;
        if (property === "og:description") metaData.ogDesc = content;
        if (property === "og:image") metaData.ogImage = this.resolveUrl(content, baseUrl);
        if (property === "og:site_name") metaData.ogSite = content;
      }

      // Twitter Card
      if (name && name.startsWith("twitter:")) {
        twitterList.push({ key: name, value: content });

        // Fallback for OGP
        if (!metaData.ogTitle && name === "twitter:title") metaData.ogTitle = content;
        if (!metaData.ogDesc && name === "twitter:description") metaData.ogDesc = content;
        if (!metaData.ogImage && name === "twitter:image") metaData.ogImage = this.resolveUrl(content, baseUrl);
      }
    });

    return { title, metaData, ogpList, twitterList };
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
      const html = await API.fetchUrl(targetUrl);
      const doc = API.parseHtml(html);
      const { title, metaData, ogpList, twitterList } = API.extractData(doc, targetUrl);

      UI.renderPageTitle(title);
      UI.renderTable(CONFIG.SELECTORS.OGP_TABLE, ogpList);
      UI.renderTable(CONFIG.SELECTORS.TWITTER_TABLE, twitterList);

      let host = "WEBSITE";
      try {
        host = new URL(targetUrl).hostname.toLowerCase();
      } catch (e) { /* ignore */ }

      UI.renderPreview(metaData, host);

      // 初期表示状態を解除
      document.body.classList.remove("initial");

      UI.showResults();

    } catch (err) {
      UI.showError(`エラーが発生しました: ${err.message}`);
    } finally {
      UI.showLoading(false);
    }
  }
};

// アプリケーション起動
document.addEventListener("DOMContentLoaded", () => App.init());

