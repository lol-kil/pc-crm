# PC/CRM - Telegram Mini App для управления задачами

## 🚀 Установка

### 1. Клонируй репо
```bash
git clone https://github.com/lol-kil/pc-crm.git
cd pc-crm
```

### 2. Установи зависимости
```bash
npm install
```

### 3. Создай `.env` файл
```bash
cp .env.example .env
```

### 4. Заполни `.env`:
- `BOT_TOKEN` - токен от BotFather
- `MONGODB_URI` - строка подключения к MongoDB
- `WEBAPP_URL` - URL где размещена CRM (GitHub Pages)

### 5. Запусти сервер
```bash
npm start
```

## 🔧 Как получить токен бота

1. Напиши @BotFather в Telegram
2. Используй команду `/newbot`
3. Придумай имя и юзернейм
4. Скопируй токен в `.env`

## 🗄️ MongoDB

1. Регистрируйся на [mongodb.com](https://mongodb.com)
2. Создай кластер (бесплатный)
3. Получи строку подключения
4. Вставь в `.env` как `MONGODB_URI`

## 📱 Развертывание бота

### На Heroku (бесплатно до конца 2022):
```bash
npm install -g heroku-cli
heroku create your-app-name
git push heroku main
```

### На Railway.app:
```bash
# 1. Залогинься на railway.app
# 2. Connect GitHub repo
# 3. Добавь переменные окружения в Dashboard
# 4. Deploy
```

## 🎮 Использование

1. Открой бота в Telegram: `@your_bot_username`
2. Нажми `/start`
3. Нажми кнопку "📊 Открыть CRM"
4. PIN: `0220`
5. Добавляй и управляй задачами!

## ✨ Возможности

- ✅ Создание/редактирование/удаление задач
- ✅ Синхронизация между всеми пользователями
- ✅ Финансовый учет (доходы/расходы)
- ✅ Календарь с задачами
- ✅ Статистика в боте

## 📞 API Endpoints

```
GET  /api/tasks          - Все задачи
GET  /api/finance        - Все финансы
POST /api/tasks          - Создать задачу
PUT  /api/tasks/:id      - Обновить задачу
DEL  /api/tasks/:id      - Удалить задачу
POST /api/finance        - Добавить запись
DEL  /api/finance/:id    - Удалить запись
```
