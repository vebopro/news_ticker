const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// キャッシュ用変数
let cachedHeadlines = [{ title: '選挙速報の取得を準備中です', time: '' }];
let lastUpdated = null;

// スクレイピング関数
async function fetchElectionHeadlines() {
  try {
    const url = 'https://news.yahoo.co.jp/pages/20250720';  // 固定URL。動的に変える場合は別途対応を
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const headlines = [];

    // 記事のaタグをセレクターで取得
    $('a.ArticleItem_pc_link__ZR7Sg').each((_, el) => {
      const title = $(el).text().trim();

      // 時間は親liの中のtimeタグ、または別のクラスにあるかも
      // ここは実際のHTML構造に合わせて適宜調整してください
      const li = $(el).closest('li');
      let timeText = '';

      // timeタグがあればそこから取得
      const timeElem = li.find('time').first();
      if (timeElem.length > 0) {
        timeText = timeElem.text().trim();
      } else {
        // もしtimeタグがなければクラス名などで取得例
        const dateElem = li.find('.ArticleItem_date__ZR7Sg').first();
        if (dateElem.length > 0) timeText = dateElem.text().trim();
      }

      if (title) {
        headlines.push({ title, time: timeText });
      }
    });

    cachedHeadlines = headlines.length > 0 ? headlines : [{ title: '選挙関連の速報は現在ありません', time: '' }];
    lastUpdated = new Date();
    console.log(`[${lastUpdated.toLocaleTimeString()}] ??? ヘッドライン更新完了`);
  } catch (e) {
    cachedHeadlines = [{ title: 'ニュース取得エラー: ' + e.message, time: '' }];
    console.error(`[${new Date().toLocaleTimeString()}] ? ヘッドライン更新失敗:`, e.message);
  }
}

// 初回取得 + 5分毎更新
fetchElectionHeadlines();
setInterval(fetchElectionHeadlines, 5 * 60 * 1000);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// APIでキャッシュを返す
app.get('/election-news', (req, res) => {
  res.json({ headlines: cachedHeadlines });
});

app.listen(port, () => {
  console.log(`?? Server running at http://localhost:${port}`);
});
