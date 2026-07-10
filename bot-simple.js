// Telegram Bot - работает напрямую с GitHub
// Все данные хранятся в одном JSON файле на GitHub Pages

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = 'lol-kil';
const GITHUB_REPO = 'pc-crm';
const DATA_FILE = 'data.json';
const WEBAPP_URL = 'https://lol-kil.github.io/pc-crm/';

const bot = new TelegramBot(TOKEN, { polling: true });

// ══════ GITHUB API ══════
const githubAPI = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  }
});

// Получить файл с GitHub
async function getDataFromGitHub() {
  try {
    const response = await githubAPI.get(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_FILE}`);
    const content = Buffer.from(response.data.content, 'base64').toString();
    return { data: JSON.parse(content), sha: response.data.sha };
  } catch (err) {
    console.log('Файл не найден, создаю новый');
    return { data: { tasks: [], finance: [] }, sha: null };
  }
}

// Сохранить файл на GitHub
async function saveDataToGitHub(data, sha) {
  try {
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const payload = {
      message: `auto: CRM data update - ${new Date().toLocaleString('ru-RU')}`,
      content,
      sha
    };
    
    const response = await githubAPI.put(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_FILE}`,
      payload
    );
    return response.data.commit.sha;
  } catch (err) {
    console.error('GitHub save error:', err.response?.data || err.message);
    throw err;
  }
}

// ══════ BOT COMMANDS ══════

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '👋 Добро пожаловать в PC/CRM!', {
    reply_markup: {
      inline_keyboard: [[{
        text: '📊 Открыть CRM',
        web_app: { url: WEBAPP_URL }
      }]]
    }
  });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const { data } = await getDataFromGitHub();
    const tasks = data.tasks || [];
    const finance = data.finance || [];
    
    const open = tasks.filter(t => !t.closed).length;
    const done = tasks.filter(t => t.closed).length;
    const income = finance.filter(f => f.type === 'inc').reduce((s, f) => s + (f.amount || 0), 0);
    const expense = finance.filter(f => f.type === 'exp').reduce((s, f) => s + (f.amount || 0), 0);
    
    const stats = `
📊 *СТАТИСТИКА*
━━━━━━━━━━━━━━
✅ Открытых: ${open}
✓ Закрытых: ${done}
━━━━━━━━━━━━━━
💰 Приход: ${income} С
💸 Расход: ${expense} С
📈 Прибыль: ${income - expense} С
    `;
    
    bot.sendMessage(chatId, stats, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, '❌ Ошибка: ' + err.message);
  }
});

bot.onText(/\/sync/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    bot.sendMessage(chatId, '⟳ Синхронизирую данные...');
    const { data, sha } = await getDataFromGitHub();
    await saveDataToGitHub(data, sha);
    bot.sendMessage(chatId, '✅ Синхронизация завершена');
  } catch (err) {
    bot.sendMessage(chatId, '❌ Ошибка синхронизации: ' + err.message);
  }
});

console.log('✅ Bot started');
console.log('Commands:');
console.log('  /start - Открыть CRM');
console.log('  /stats - Показать статистику');
console.log('  /sync - Синхронизировать данные');
