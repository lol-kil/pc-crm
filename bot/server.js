import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;

// MongoDB подключение
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ══════ SCHEMES ══════
const taskSchema = new mongoose.Schema({
  id: String,
  date: String,
  client: String,
  phone: String,
  addr: String,
  taskType: String,
  note: String,
  closed: Boolean,
  income: Number,
  closeNote: String,
  createdBy: Number, // Telegram ID юзера
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const financeSchema = new mongoose.Schema({
  id: String,
  type: String, // 'inc' или 'exp'
  amount: Number,
  desc: String,
  date: String,
  createdBy: Number,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  telegramId: Number,
  firstName: String,
  username: String,
  role: { type: String, default: 'user' }, // 'admin' или 'user'
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);
const Finance = mongoose.model('Finance', financeSchema);
const User = mongoose.model('User', userSchema);

// ══════ BOT ══════
const bot = new TelegramBot(TOKEN, { polling: true });

// Middleware
app.use(express.json());

// WebApp redirect
app.get('/', (req, res) => {
  res.json({ status: 'Bot is running' });
});

// ══════ API ENDPOINTS ══════

// GET все задачи
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ date: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET все финансы
app.get('/api/finance', async (req, res) => {
  try {
    const entries = await Finance.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST новая задача
app.post('/api/tasks', async (req, res) => {
  try {
    const { date, client, phone, addr, taskType, note, createdBy } = req.body;
    
    const task = new Task({
      id: 'T' + Date.now(),
      date,
      client,
      phone,
      addr,
      taskType,
      note,
      closed: false,
      income: null,
      closeNote: '',
      createdBy
    });
    
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT обновить задачу
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE задача
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST финансовая запись
app.post('/api/finance', async (req, res) => {
  try {
    const { type, amount, desc, date, createdBy } = req.body;
    
    const entry = new Finance({
      id: 'F' + Date.now(),
      type,
      amount,
      desc,
      date,
      createdBy
    });
    
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE финансовая запись
app.delete('/api/finance/:id', async (req, res) => {
  try {
    await Finance.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════ BOT COMMANDS ══════

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Сохраняем пользователя
  await User.findOneAndUpdate(
    { telegramId: userId },
    {
      telegramId: userId,
      firstName: msg.from.first_name,
      username: msg.from.username
    },
    { upsert: true }
  );
  
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📅 Открыть CRM',
          web_app: { url: process.env.WEBAPP_URL || 'https://your-app.vercel.app' }
        }
      ]
    ]
  };
  
  bot.sendMessage(chatId, '👋 Добро пожаловать в PC/CRM!\n\nНажми кнопку ниже чтобы открыть приложение:', {
    reply_markup: keyboard
  });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  const tasks = await Task.find();
  const finance = await Finance.find();
  
  const open = tasks.filter(t => !t.closed).length;
  const done = tasks.filter(t => t.closed).length;
  const income = finance.filter(f => f.type === 'inc').reduce((s, f) => s + f.amount, 0);
  const expense = finance.filter(f => f.type === 'exp').reduce((s, f) => s + f.amount, 0);
  
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
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bot token: ${TOKEN ? 'OK' : 'MISSING'}`);
  console.log(`MongoDB: ${MONGODB_URI ? 'OK' : 'MISSING'}`);
});
