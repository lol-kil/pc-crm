// Конфигурация для Telegram WebApp
// Используй это в своем боте

const WEBAPP_URL = 'https://lol-kil.github.io/pc-crm/'; // URL где размещена твоя CRM

// Пример кода для Telegram бота (Python с aiogram):
/*
from aiogram import Bot, Dispatcher, types
from aiogram.utils.keyboard import InlineKeyboardBuilder

bot = Bot(token='YOUR_BOT_TOKEN')
dp = Dispatcher()

@dp.message(commands=['start'])
async def start(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.button(
        text="📊 Открыть CRM",
        web_app=types.WebAppInfo(url=WEBAPP_URL)
    )
    await message.answer(
        "Привет! Нажми кнопку чтобы открыть CRM",
        reply_markup=builder.as_markup()
    )
*/

// Для Node.js (Telegraf):
/*
const { Telegraf } = require('telegraf');
const bot = new Telegraf('YOUR_BOT_TOKEN');

bot.start((ctx) => {
  ctx.reply('Привет!', {
    reply_markup: {
      inline_keyboard: [[{
        text: '📊 Открыть CRM',
        web_app: { url: WEBAPP_URL }
      }]]
    }
  });
});
*/

// Данные для подключения:
module.exports = {
  WEBAPP_URL: WEBAPP_URL,
  PIN: '0220', // Используется в index.html
  GITHUB_OWNER: 'lol-kil',
  GITHUB_REPO: 'pc-crm',
  GITHUB_FILE: 'data.json'
};
