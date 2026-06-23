# ArcheRoulette

A website for a League of Legends streamer. Viewers vote on which champion the
streamer should play next; once voting ends, a roulette wheel — weighted by
the vote counts — picks the winner live on screen.

## How the website works

The site has two faces:

- **Public site** — anyone can visit and vote during an active round, watch
  the roulette spin, see champion/match statistics, and check the streamer's
  current rank.
- **Admin panel** — a single authenticated admin controls voting rounds, spins
  the wheel, records match results, manages champion bans/cooldowns, and
  configures the site.

### Public pages

| Page | What it shows |
|---|---|
| **Oylama** (`/`) | The voting screen. Shows a countdown, the champion grid to vote on, a live results pie chart, a rank panel, and a "banned/cooldown" sidebar. When no round is active it shows a waiting message; after a round ends it reveals the winner. |
| **İstatistik** (`/istatistik`) | A sortable table of every played champion's times-played, wins, losses, and win rate. |
| **Maç Geçmişi** (`/mac-gecmisi`) | Full match history with win/loss totals and filters. |

### Admin pages (`/admin/...`, requires login)

| Page | What it does |
|---|---|
| **Oylama** | Start/end/cancel a voting round, spin the roulette wheel, record the match result (which also manages bans/cooldowns), and search/ban champions. |
| **Rank** | Either link a Riot account for automatic rank syncing, or set tier/division/LP manually. Win/loss/streak are always automatic. |
| **Maç Geçmişi** | Manually add or delete match records. |
| **İstatistikler** | Same stats table as the public page, for admin reference. |
| **Ayarlar** | Change admin password, toggle the champion cooldown system, set the Riot API key, and a "danger zone" full data reset. |

## The roulette system, step by step

1. **Admin starts a round** — picks a duration (minutes/seconds). All previous
   votes are cleared and a fresh voting session begins. Champions currently
   banned or on cooldown are excluded from voting.
2. **Viewers vote** — one vote per IP per round (enforced server-side via a
   voter log keyed by IP, not just client-side). Vote counts update live for
   everyone watching.
3. **Round ends** — either the timer runs out or the admin ends it early. The
   champion grid locks; an admin-only "spin" control appears.
4. **The spin** — when the admin clicks "Çarkı Çevir," the **server** (not the
   browser) picks the winner using a weighted-random algorithm: each
   champion's chance of winning equals `their votes ÷ total votes`. For
   example, with Vladimir: 3, Ashe: 2, Kayle: 8 (13 total), Kayle has a 8/13
   chance, Ashe 2/13, Vladimir 3/13 — Kayle is favored but anyone can still
   win. The frontend then animates a canvas-drawn wheel — slice sizes match
   the vote shares — spinning to land exactly on whichever champion the
   server already chose.
5. **Reveal** — the public page waits for the spin animation to actually
   finish before revealing the winner, so nobody sees the result early.
6. **Recording the result** — the admin clicks **Galibiyet** (win) or
   **Mağlubiyet** (loss) for the chosen champion. This single action:
   - Logs the match in history
   - Updates that champion's times-played/win count
   - Updates the streamer's overall win/loss (always derived live from match
     history, never out of sync) and the win/lose streak
   - Puts the champion on cooldown for N future rounds (if cooldown is
     enabled in Ayarlar), so it can't be picked again right away
   - Resets the session back to idle, ready for the next round
7. **Cancelling instead of recording** — if the admin cancels a round without
   recording a result, nothing changes: no cooldown is applied and every
   champion remains immediately votable.

Champions can also be **permanently banned** (manual toggle in admin), which
is separate from the automatic, temporary cooldown above.

## Tech stack

- **Backend:** Node.js, TypeScript, Express, MongoDB (Mongoose)
- **Frontend:** React, TypeScript, Vite
- **Auth:** JWT stored in an httpOnly cookie
- **External API:** Riot Games API (optional, for automatic rank sync)

## Project structure

```
ArcheRoulette/
├── backend/    Express API, MongoDB models, Riot API integration
└── frontend/   React app (public + admin views)
```

## Setup

### Prerequisites

- Node.js 18+ (built-in `fetch` is required)
- A running MongoDB instance (local or remote)

### 1. Install dependencies

From the repository root (installs both workspaces):

```bash
npm install
```

### 2. Configure the backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/archeroulette
JWT_SECRET=<generate below>
JWT_EXPIRES_IN=7d
FRONTEND_ORIGIN=http://localhost:3000
ENCRYPTION_KEY=<generate below>
RIOT_API_KEY=
```

Generate the two secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ENCRYPTION_KEY
```

`RIOT_API_KEY` can be left blank — set it later from the admin **Ayarlar**
page instead (it's stored encrypted in the database, not in `.env`).

### 3. Seed champion data

Pulls the full champion list from Riot's Data Dragon CDN into MongoDB:

```bash
cd backend
npm run seed:champions
```

### 4. Create an admin account

There's no signup form — insert the admin user directly into MongoDB.

```bash
cd backend
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" "your-password-here"
```

Copy the printed hash, then in `mongosh` (connected to your `MONGODB_URI`
database):

```js
db.users.insertOne({
  username: "admin",
  password: "<paste the bcrypt hash here>",
  role: "admin",
  tokenVersion: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5. Run the app

From the repository root, this starts both the backend and frontend together:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin login: http://localhost:3000/admin/login

### 6. (Optional) Connect a Riot account for automatic rank sync

1. Get a Riot API key from [developer.riotgames.com](https://developer.riotgames.com/)
   (development keys expire every 24h — production keys don't, but require
   an application).
2. In admin **Ayarlar**, paste the key into "Riot API Anahtarı."
3. In admin **Rank**, link the streamer's Riot ID (`name#tag`) and server.
   Rank/LP then auto-refreshes every 5 minutes.

## Other useful scripts (run from `backend/`)

| Command | Purpose |
|---|---|
| `npm run seed:champions` | (Re-)populate the champion list from Data Dragon |
| `npm run simulate:spin` | Verify the roulette's weighted odds against real votes currently in the DB |
| `npm run simulate:random_spin` | Stress-test the same odds with randomized vote distributions |
