import express from 'express';
import mongoose from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const TOKEN = process.env.BOT_TOKEN;
const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL;
const PIN = process.env.PI_CODE || '0220';

// MongoDB
mongoose.connect(MONGODB_URI).catch(err => console.error('MongoDB connection error:', err));

// Schemas
const taskSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  date: String,
  client: String,
  phone: String,
  addr: String,
  taskType: String,
  note: String,
  closed: Boolean,
  income: Number,
  closeNote: String,
  createdBy: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const financeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  type: String,
  amount: Number,
  desc: String,
  date: String,
  createdBy: Number,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  firstName: String,
  username: String,
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);
const Finance = mongoose.model('Finance', financeSchema);
const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ date: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance', async (req, res) => {
  try {
    const entries = await Finance.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    io.emit('task:created', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    io.emit('task:updated', task);
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.deleteOne({ id: req.params.id });
    io.emit('task:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    io.emit('finance:created', entry);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/finance/:id', async (req, res) => {
  try {
    await Finance.deleteOne({ id: req.params.id });
    io.emit('finance:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bot
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  await User.findOneAndUpdate(
    { telegramId: userId },
    {
      telegramId: userId,
      firstName: msg.from.first_name,
      username: msg.from.username
    },
    { upsert: true }
  );
  
  bot.sendMessage(chatId, '👋 Добро пожаловать в PC/CRM!', {
    reply_markup: {
      inline_keyboard: [
        [{
          text: '📊 Открыть CRM',
          web_app: { url: WEBAPP_URL }
        }]
      ]
    }
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
  
  bot.sendMessage(chatId, `
📊 *СТАТИСТИКА*
━━━━━━━━━━━━━━
✅ Открытых: ${open}
✓ Закрытых: ${done}
━━━━━━━━━━━━━━
💰 Приход: ${income} С
💸 Расход: ${expense} С
📈 Прибыль: ${income - expense} С
  `, { parse_mode: 'Markdown' });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📱 Bot token: ${TOKEN ? 'OK' : 'MISSING'}`);
  console.log(`🗄️  MongoDB: ${MONGODB_URI ? 'OK' : 'MISSING'}`);
});
