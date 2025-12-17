export default async function handler(req, res) {
  const { url } = req.query;

  // URLパラメータのチェック
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // セキュリティチェック (自ドメイン以外からのアクセスを拒否)
  const myHost = req.headers.host;
  const referer = req.headers.referer;

  // localhost (開発環境) は許可、それ以外はRefererチェック
  const isLocal = myHost && (myHost.includes('localhost') || myHost.includes('127.0.0.1'));

  // Refererが空、または自分のホストを含まない場合は拒否
  if (!isLocal && (!referer || !referer.includes(myHost))) {
    return res.status(403).json({ error: 'Forbidden: External access denied' });
  }

  try {
    // ターゲットURLのHTMLを取得
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // 結果をJSONで返す (HTML文字列と最終的なURLを含む)
    res.status(200).json({ contents: html, finalUrl: response.url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}