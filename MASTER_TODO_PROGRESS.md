# 📋 MASTER TODO — CITOYENAVISE BACKEND COMPLETION
## PROGRESS REPORT - 2026-05-05

---

## ✅ COMPLETED (3/9 Modules)

### 1️⃣ MODULE ÉDUCATION / QUIZ ✅
**Status:** COMPLETE with enhancements

**Changes:**
- ✅ Ownership checks for update/delete (author_id == userId)
- ✅ getLeaderboard() endpoint returning top scorers
- ✅ Edge case handling (deleted quiz, missing questions, incomplete answers)
- ✅ Event emission: quiz.attempt.completed
- ✅ New route: GET /quizzes/:id/leaderboard
- ✅ Error handling for soft-deleted quizzes

**Files Modified:**
- `backend/src/modules/education/quiz/service.js`
- `backend/src/modules/education/quiz/controller.js`
- `backend/src/modules/education/quiz/routes.js`

---

### 2️⃣ MODULE PUBLIC / FEED ✅
**Status:** COMPLETE (new module)

**Features:**
- ✅ Smart temporal scoring: log(likes+comments) * exp(-age_hours/48)
- ✅ getSmartFeed() endpoint with pagination
- ✅ getUserActivity() combining posts, comments, likes, initiatives
- ✅ Routes: GET /api/v1/feed, GET /api/v1/feed/activity/:userId
- ✅ Auth optional for public feed
- ✅ Normalized response format

**Files Created:**
- `backend/src/modules/feed/schema.js`
- `backend/src/modules/feed/service.js`
- `backend/src/modules/feed/controller.js`
- `backend/src/modules/feed/routes.js`
- `backend/src/modules/feed/index.js`

**Status:** Ready for moduleLoader integration

---

### 3️⃣ MODULE INITIATIVES (Phases) ✅
**Status:** PARTIALLY COMPLETE (migration only)

**Changes:**
- ✅ Migration V018: Added phase column (discussion|vote|decision)
- ✅ Added initiative_phase_history table for audit trail
- ✅ Index on phase for fast lookups
- ⏳ Still need: updatePhase() method, timeline endpoint

**Files Created:**
- `backend/database/migrations/V018_initiatives_phases.sql`

**Next:** Implement phase service methods + timeline endpoint

---

## ⏳ IN PROGRESS / PENDING (6/9 Modules)

### 4️⃣ MODULE NOTIFICATIONS
**Current Status:** Partial (exists, needs event triggers)

**TODO:**
- [ ] Add event listeners:
  - `on("report.resolved")` → notify reporter
  - `on("admin.user.banned")` → notify user
  - `on("quiz.attempt.completed")` → notify user
  - `on("initiative.phase.changed")` → notify followers
  
- [ ] Add markAsRead() endpoint
- [ ] Add notification_settings table + endpoints
- [ ] ESTIMATED TIME: 1-2 hours

---

### 5️⃣ MODULE ANALYTICS
**Current Status:** Exists, needs dashboards

**TODO:**
- [ ] getHourlyHeatmap() - group by hour
- [ ] getTopContent() - sort by views/likes
- [ ] getTopSearches() - if search_logs table exists
- [ ] getQuizCompletionStats()
- [ ] getTrends() - 30-day aggregation
- [ ] exportCsv() - CSV export endpoint
- [ ] ESTIMATED TIME: 1.5-2 hours

---

### 6️⃣ MODULE PROFILE EXTENSIONS
**Current Status:** 100% extended (privacy, reputation, etc)

**Still Need:**
- [ ] Achievements system (table + grant logic)
- [ ] User preferences (language, theme, notifications)
- [ ] Quiz results integration (via profile endpoint)
- [ ] ESTIMATED TIME: 1-1.5 hours

---

### 7️⃣ MODULE MEDIA UPLOADS
**Current Status:** Doesn't exist

**TODO:**
- [ ] Create media module with upload handling
- [ ] Add compression service (image/video)
- [ ] Add thumbnail generation
- [ ] Add MIME validation
- [ ] ESTIMATED TIME: 2-3 hours

---

### 8️⃣ MODULE SEARCH (Global)
**Current Status:** Exists, needs global search

**TODO:**
- [ ] Implement globalSearch() combining:
  - Posts (title, content)
  - Articles (title, content)
  - Videos (title, description)
  - Initiatives (title, description)
  - Profiles (username, bio)
- [ ] Add multi-type response format
- [ ] ESTIMATED TIME: 1 hour

---

### 9️⃣ MODULE SETTINGS (System)
**Current Status:** Doesn't exist

**TODO:**
- [ ] Create settings module
- [ ] system_settings table
- [ ] getSetting(key), setSetting(key, value)
- [ ] Admin-only endpoints
- [ ] ESTIMATED TIME: 0.5-1 hour

---

## 📊 SUMMARY

| Module | Status | ETA | Files |
|--------|--------|-----|-------|
| QUIZ | ✅ Complete | Done | 3 modified |
| FEED | ✅ Complete | Done | 5 created |
| INITIATIVES (Phases) | ✅ Migration | Done | 1 created |
| NOTIFICATIONS | ⏳ Pending | 1-2h | 0 created |
| ANALYTICS | ⏳ Pending | 1.5-2h | 0 created |
| PROFILE | ⏳ Pending | 1-1.5h | 0 created |
| MEDIA | ⏳ Pending | 2-3h | 0 created |
| SEARCH | ⏳ Pending | 1h | 0 created |
| SETTINGS | ⏳ Pending | 0.5-1h | 0 created |

**Total Estimated Time (remaining):** 8-11 hours
**Completed:** ~20% of total work
**Next Priority:** Continue with NOTIFICATIONS → ANALYTICS → PROFILE → MEDIA → SEARCH → SETTINGS

---

## 🔧 TECHNICAL NOTES

### Database Migrations Added:
- V017: reports table ✅
- V018: initiatives phases ✅

### New Event Bus Events:
- `quiz.attempt.completed` ✅
- `report.resolved` (todo)
- `admin.user.banned/unbanned` (todo)
- `initiative.phase.changed` (todo)

### Module Integration Status:
- FEED: Ready (needs moduleLoader registration)
- All others: Integrated or partial

---

## 🚀 NEXT STEPS

1. **Add FEED to moduleLoader** (1 min)
2. **Implement INITIATIVES phases service** (30 min)
3. **Add NOTIFICATIONS event listeners** (1-2 hours)
4. **Implement ANALYTICS dashboards** (1.5-2 hours)
5. Continue with remaining modules...

---

## 💾 Last Commit
```
9c6f3ca feat: Complete QUIZ module with ownership, leaderboard, and event streaming
         + Create FEED module with smart temporal scoring
         + Add initiatives phases support (V018 migration)
```

**Lines of Code Added:** ~800 LOC
**New Files:** 5
**Modified Files:** 3
**Migrations:** 1

