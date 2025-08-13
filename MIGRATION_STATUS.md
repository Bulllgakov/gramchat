# 📊 Shop → Bot Migration Status

## ✅ Completed Backend Changes

### Database Schema
- ✅ Created new Prisma schema with Bot model replacing Shop
- ✅ Added BotManager junction table for many-to-many relationships
- ✅ Updated Dialog model to use botId instead of shopId
- ✅ Removed all Shop-related models and references

### Backend Routes
- ✅ **bot.routes.ts** - New routes for bot management (formerly shop.routes.ts)
- ✅ **bot-manager.routes.ts** - New API for managing bot-manager assignments
- ✅ **dialog.routes.ts** - Updated to use botId instead of shopId
- ✅ **admin.routes.ts** - Updated all shop references to bot
- ✅ **auth.routes.ts** - Updated authentication to work with bots

### Services
- ✅ **botManager.ts** - Updated to work with Bot model
- ✅ **messageHandler.ts** - Updated to use botId instead of shopId

### Real-time Communication
- ✅ **server.ts** - Updated Socket.IO rooms from `shop-${id}` to `bot-${id}`
- ✅ **index.ts** - Updated Socket.IO event handlers
- ✅ Added legacy support for backward compatibility

### New Features Implemented
- ✅ Owners can have multiple bots
- ✅ Managers can be assigned to specific bots
- ✅ Dynamic bot assignment/revocation for managers
- ✅ General invite codes (not tied to specific bots)

## ⏳ Pending Tasks

### 1. Database Migration (PRIORITY)
```bash
# Start Docker and PostgreSQL
sudo service docker start
docker-compose up -d

# Apply migration
cd backend
npx prisma migrate deploy

# If migration fails, reset database
npx prisma db push --force-reset
```

### 2. Frontend Updates Required

#### Components to Update:
- [ ] **ShopDashboard** → **BotsDashboard**
- [ ] **CreateShopForm** → **CreateBotForm**
- [ ] **ShopsList** → **BotsList**
- [ ] **ShopSettings** → **BotSettings**

#### API Calls to Update:
```javascript
// Old:
apiService.get('/shops')
apiService.post('/shops')
socket.emit('join-shop', shopId)

// New:
apiService.get('/bots')
apiService.post('/bots')
apiService.get('/my-bots')
socket.emit('join-bot', botId)
```

#### New Components Needed:
- [ ] **BotSelector** - For managers to switch between assigned bots
- [ ] **ManagerBotAssignment** - Already created, needs integration

### 3. Testing Checklist

#### Owner Flow:
- [ ] Create multiple bots
- [ ] View all owned bots
- [ ] Create invite codes for managers
- [ ] Assign/remove bots from managers

#### Manager Flow:
- [ ] Register with general invite code
- [ ] View only assigned bots
- [ ] Switch between assigned bots
- [ ] Work with dialogs from assigned bots only

#### Admin Flow:
- [ ] View all bots in system
- [ ] Approve/reject bots
- [ ] Manage all users

### 4. Environment Variables
Ensure these are set:
```env
TELEGRAM_AUTH_BOT_TOKEN=your_bot_token
FIRST_ADMIN_TELEGRAM_ID=236692046
```

## 🚨 Important Notes

1. **Breaking Changes:**
   - All Shop references removed
   - New Bot model structure
   - Changed API endpoints (/shops → /bots)
   - Changed Socket.IO events (join-shop → join-bot)

2. **Backward Compatibility:**
   - Legacy Socket.IO events supported temporarily
   - Old shop IDs will need to be migrated to bot IDs

3. **Data Migration:**
   - Existing Shop data needs to be migrated to Bot model
   - InviteCode shopId references need to be removed
   - User managedShopId references replaced with BotManager

## 🎯 Next Steps

1. **Immediate:** Start database and apply migration
2. **High Priority:** Update frontend components to use Bot model
3. **Medium Priority:** Test complete flow with multiple bots
4. **Low Priority:** Remove legacy compatibility code after migration

## 📝 Migration Commands

```bash
# Full migration sequence
cd /home/ulat/gramchat

# 1. Start services
docker-compose up -d

# 2. Generate Prisma client
cd backend
npx prisma generate

# 3. Apply migration
npx prisma migrate deploy

# 4. Start backend
npm run dev

# 5. Start frontend
cd ../frontend
npm run dev
```

## ✨ New Capabilities After Migration

1. **Multi-bot Support:** Owners can manage multiple Telegram bots
2. **Flexible Manager Assignment:** Dynamically assign/revoke bot access
3. **Simplified Registration:** General invite codes for managers
4. **Better Scalability:** Support for larger operations with multiple bots
5. **Improved Access Control:** Granular permissions per bot

## 🐛 Known Issues to Fix

1. Docker daemon not running (requires sudo)
2. Frontend components still using Shop model
3. Migration SQL files need to be tested
4. Some route files may still have Shop references

---

*Last updated: 2025-08-13*
*Migration started from conversation context*