const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

app.use(express.static('public')); // HTMLファイルを提供

app.get('/election-news', async (req, res) => {
  try {
    const response = await axios.get('https://news.yahoo.co.jp/flash');
    const $ = cheerio.load(response.data);
    const headlines = [];

    // 新着ニュースのセクションをターゲット（セレクタはページ構造に応じて調整）
    $('div#flashNews article').each((i, element) => {
      const title = $(element).find('h2').text().trim();
      // 選挙関連のキーワードでフィルタリング
      if (title.match(/選挙|参院選|衆院選|投票|当選|党|開票|候補自民党|自民|与党|公明|立民|立憲|維新|国民|国民民主|共産|共産党|れいわ|社民|社会民主党|NHK党|旧NHK|諸派|ごぼう|新党くにもり|くにもり|つばさ|幸福党|幸福実現党|オリーブ/i)) {
        headlines.push(title);
      }
    });

    if (headlines.length === 0) {
      headlines.push('選挙関連の速報は現在ありません');
    }

    res.json({ headlines: headlines.join(' ◆ ') });
  } catch (error) {
    res.json({ headlines: 'ニュース取得エラー: ' + error.message });
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));