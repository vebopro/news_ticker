const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// �L���b�V���p�ϐ�
let cachedHeadlines = [{ title: '�I������̎擾���������ł�', time: '' }];
let lastUpdated = null;

// �X�N���C�s���O�֐�
async function fetchElectionHeadlines() {
  try {
    const url = 'https://news.yahoo.co.jp/pages/20250720';  // �Œ�URL�B���I�ɕς���ꍇ�͕ʓr�Ή���
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const headlines = [];

    // �L����a�^�O���Z���N�^�[�Ŏ擾
    $('a.ArticleItem_pc_link__ZR7Sg').each((_, el) => {
      const title = $(el).text().trim();

      // ���Ԃ͐eli�̒���time�^�O�A�܂��͕ʂ̃N���X�ɂ��邩��
      // �����͎��ۂ�HTML�\���ɍ��킹�ēK�X�������Ă�������
      const li = $(el).closest('li');
      let timeText = '';

      // time�^�O������΂�������擾
      const timeElem = li.find('time').first();
      if (timeElem.length > 0) {
        timeText = timeElem.text().trim();
      } else {
        // ����time�^�O���Ȃ���΃N���X���ȂǂŎ擾��
        const dateElem = li.find('.ArticleItem_date__ZR7Sg').first();
        if (dateElem.length > 0) timeText = dateElem.text().trim();
      }

      if (title) {
        headlines.push({ title, time: timeText });
      }
    });

    cachedHeadlines = headlines.length > 0 ? headlines : [{ title: '�I���֘A�̑���͌��݂���܂���', time: '' }];
    lastUpdated = new Date();
    console.log(`[${lastUpdated.toLocaleTimeString()}] ??? �w�b�h���C���X�V����`);
  } catch (e) {
    cachedHeadlines = [{ title: '�j���[�X�擾�G���[: ' + e.message, time: '' }];
    console.error(`[${new Date().toLocaleTimeString()}] ? �w�b�h���C���X�V���s:`, e.message);
  }
}

// ����擾 + 5�����X�V
fetchElectionHeadlines();
setInterval(fetchElectionHeadlines, 5 * 60 * 1000);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API�ŃL���b�V����Ԃ�
app.get('/election-news', (req, res) => {
  res.json({ headlines: cachedHeadlines });
});

app.listen(port, () => {
  console.log(`?? Server running at http://localhost:${port}`);
});
