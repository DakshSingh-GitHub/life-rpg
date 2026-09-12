# ⚔️ LifeRPG Authoritative Backend Service

High-performance, event-driven Game Engine & AI Dungeon Master built with **Python 3.11** and **FastAPI**.

---

## 🌟 Architecture Overview

The backend acts as the authoritative source of truth for the LifeRPG realm:
1. **Authoritative Quest Engine**: Computes non-linear XP curves, attribute gains (Brawn, Intellect, Swiftness, Vitality), dynamic Gold bounties, and streak rules server-side.
2. **Atomic Shop & Armory Vault**: Handles inventory transactions and gold balance deductions safely.
3. **Automated Midnight Reset (Cron Worker)**: Powered by `APScheduler`, automatically rolls over recurring daily habits and audits streaks at **00:00 IST**.
4. **AI Dungeon Master**: Translates real-world goals and chores into custom RPG questlines (powered by Google Gemini API with fallback generators).
5. **Real-time Leaderboards**: Aggregates top adventurers by total XP, streak duration, and attribute dominance.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (`.env`)
Make sure `backend/.env` contains your Supabase credentials:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
TIMEZONE=Asia/Kolkata
GEMINI_API_KEY=your-gemini-key-optional
```

### 3. Start the Server
```bash
python run.py
# or using uvicorn directly:
uvicorn main:app --reload --port 8000
```

---

## 📖 Interactive API Documentation

Once the server is running, visit:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🛠️ API Endpoints Reference

### 1. Quest Engine
- `POST /api/quests/{quest_id}/complete`: Completes a quest, awards XP, handles level-up thresholds, rolls for critical gold bonus, and increments streaks.
- `GET /api/quests/user/{user_id}`: Retrieves all quests for an adventurer.

### 2. Shop & Economy
- `POST /api/shop/redeem`: Atomically checks gold balance, deducts gold, and grants reward item.
- `GET /api/shop/unlocked/{user_id}`: Fetches all unlocked armory items for an adventurer.

### 3. Automation & Cron
- `POST /api/cron/midnight-reset`: Triggers midnight recurring task reset & streak audit immediately.
- `GET /api/cron/status`: Returns scheduler running status, next scheduled execution time, and timezone.

### 4. AI Dungeon Master
- `POST /api/ai/generate-questline`: Generates a full RPG questline from a plain English objective.
- `POST /api/ai/enroll-questline`: Batch enrolls generated quests into the player's active quest log.

### 5. Leaderboards
- `GET /api/leaderboards?limit=25&sort_by=level`: Computes rankings and attribute champions across the realm.
