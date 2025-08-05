import TelegramBot from 'node-telegram-bot-api';
import Redis from 'ioredis';

class AuthBotService {
  private bot: TelegramBot | null = null;
  private authTokens: Map<string, number> = new Map();
  private redis: Redis | null = null;
  private isInitializing: boolean = false;
  private isInitialized: boolean = false;
  private processedMessages: Set<number> = new Set();

  async init() {
    const token = process.env.TELEGRAM_AUTH_BOT_TOKEN;
    
    if (!token) {
      console.warn('⚠️  Telegram auth bot token not configured');
      return;
    }

    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log('⏳ Bot is already initializing, skipping...');
      return;
    }

    if (this.isInitialized && this.bot) {
      console.log('✅ Bot is already initialized and running');
      return;
    }

    this.isInitializing = true;

    // Stop existing bot if any
    if (this.bot) {
      console.log('🔄 Stopping existing bot instance...');
      await this.stop();
      // Add delay to ensure complete cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      // Initialize Redis
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      console.log('🔴 Redis connected for auth tokens');
      
      // Create bot instance with proper polling settings
      this.bot = new TelegramBot(token, { 
        polling: true
      });
      
      // Получаем информацию о боте
      const botInfo = await this.bot.getMe();
      console.log('🤖 Bot info:', {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name
      });
      
      // Setup handlers
      this.setupHandlers();
      
      // Manually check for updates to debug
      setTimeout(async () => {
        try {
          const updates = await this.bot!.getUpdates();
          console.log('📬 Manual update check, found:', updates.length, 'updates');
          if (updates.length > 0) {
            console.log('📬 First update:', JSON.stringify(updates[0], null, 2));
          }
        } catch (error) {
          console.error('❌ Error getting updates:', error);
        }
      }, 3000);
      
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ Telegram auth bot initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize auth bot:', error);
      this.isInitializing = false;
      this.isInitialized = false;
      // Clean up on error
      if (this.bot) {
        try {
          await this.bot.stopPolling();
        } catch (e) {}
        this.bot = null;
      }
    }
  }

  private setupHandlers() {
    if (!this.bot) return;

    console.log('🎯 Setting up bot handlers...');
    
    // Add debug logging for all updates
    this.bot.on('message', (msg) => {
      console.log('📩 Received any message:', {
        type: msg.chat.type,
        id: msg.message_id,
        from: msg.from?.username,
        text: msg.text
      });
    });

    // Обработка ошибок
    this.bot.on('polling_error', (error) => {
      console.error('❌ Polling error:', {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      });
    });

    this.bot.on('error', (error) => {
      console.error('❌ Bot error:', {
        message: error.message,
        code: (error as any).code,  
        stack: error.stack
      });
    });
    
    this.bot.on('webhook_error', (error) => {
      console.error('❌ Webhook error:', error);
    });
    
    // Log when polling starts
    console.log('📡 Bot polling status:', this.bot.isPolling());

    // Единый обработчик всех текстовых сообщений
    this.bot.on('text', async (msg) => {
      const messageId = msg.message_id;
      const text = msg.text;
      const chatId = msg.chat.id;
      const userId = msg.from?.id;
      
      // Check for duplicate messages
      if (this.processedMessages.has(messageId)) {
        console.log('⚠️ Duplicate message, skipping:', messageId);
        return;
      }
      
      this.processedMessages.add(messageId);
      
      // Clean up old message IDs (keep only last 100)
      if (this.processedMessages.size > 100) {
        const arr = Array.from(this.processedMessages);
        this.processedMessages = new Set(arr.slice(-100));
      }
      
      console.log('📨 Received message:', {
        message_id: messageId,
        chat_id: chatId,
        text: text,
        from: msg.from?.username || msg.from?.first_name,
        user_id: userId
      });

      if (!text || !userId) return;

      // Обработка /start
      if (text === '/start') {
        console.log('🚀 Processing /start command');
        try {
          await this.bot!.sendMessage(
            chatId,
            '👋 Добро пожаловать в GramChat!\n\n🔐 Используйте /login для входа\n🎟️ Если у вас есть инвайт-код, используйте /login КОД'
          );
          console.log('✅ /start response sent successfully');
        } catch (error) {
          console.error('❌ Error sending /start response:', error);
        }
        return;
      }

      // Обработка /login с возможным инвайт-кодом
      if (text.startsWith('/login')) {
        console.log('🔐 Processing /login command');
        
        // Извлекаем инвайт-код если есть
        const parts = text.split(' ');
        const inviteCode = parts[1];
        
        const token = Math.random().toString(36).substring(2, 15);
        
        // Store in both memory and Redis
        this.authTokens.set(token, userId);
        if (this.redis) {
          await this.redis.setex(`auth:token:${token}`, 300, userId.toString()); // 5 minutes TTL
        }
        console.log(`🎫 Generated token: ${token} for user: ${userId}`);
        
        // Cleanup after 5 minutes
        setTimeout(() => {
          this.authTokens.delete(token);
        }, 5 * 60 * 1000);
        
        const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
        let authLink = `${frontendUrl}/auth?token=${token}`;
        
        // Добавляем инвайт-код в URL, если он есть
        if (inviteCode) {
          authLink += `&invite=${inviteCode}`;
          console.log(`🎟️ Включен инвайт-код: ${inviteCode}`);
        }
        
        // Формируем сообщение
        let message = `🔐 <b>Ваша ссылка для входа:</b>\n\n<code>${authLink}</code>\n\n⏱ Действительна 5 минут\n📋 Нажмите на ссылку чтобы скопировать`;
        
        if (inviteCode) {
          message += `\n\n✅ Инвайт-код <b>${inviteCode}</b> будет применен автоматически`;
        }
        
        try {
          const result = await this.bot!.sendMessage(chatId, message, {
            parse_mode: 'HTML'
          });
          console.log('✅ /login response sent successfully, message_id:', result.message_id);
        } catch (error) {
          console.error('❌ Error sending /login response:', error);
        }
        return;
      }

      // Обработка инвайт-кодов отправленных как обычное сообщение
      const upperText = text.trim().toUpperCase();
      if (upperText.length === 8 && /^[A-Z0-9]+$/.test(upperText)) {
        console.log('🎟️ Возможный инвайт-код обнаружен:', upperText);
        
        try {
          await this.bot!.sendMessage(
            chatId,
            `🎟️ Если это инвайт-код, используйте команду:\n\n<code>/login ${upperText}</code>\n\nНажмите на команду чтобы скопировать`,
            { parse_mode: 'HTML' }
          );
          console.log('✅ Invite code hint sent');
        } catch (error) {
          console.error('❌ Error sending invite code hint:', error);
        }
      }
    });
  }

  public async validateToken(token: string): Promise<number | null> {
    console.log('🔍 Validating token:', token);
    console.log('📦 Current tokens map:', Array.from(this.authTokens.entries()));
    
    // Check memory first
    const userId = this.authTokens.get(token);
    if (userId) {
      console.log('✅ Token valid for user (from memory):', userId);
      this.authTokens.delete(token);
      if (this.redis) {
        await this.redis.del(`auth:token:${token}`);
      }
      return userId;
    }
    
    // Check Redis
    if (this.redis) {
      const redisUserId = await this.redis.get(`auth:token:${token}`);
      if (redisUserId) {
        console.log('✅ Token valid for user (from Redis):', redisUserId);
        await this.redis.del(`auth:token:${token}`);
        return parseInt(redisUserId);
      }
    }
    
    console.log('❌ Token not found or expired');
    return null;
  }

  // Метод для остановки бота
  public async stop() {
    try {
      this.isInitialized = false;
      this.isInitializing = false;
      
      if (this.bot) {
        console.log('🛑 Stopping bot polling...');
        await this.bot.stopPolling();
        // Удаляем все обработчики событий
        this.bot.removeAllListeners();
        this.bot = null;
        console.log('✅ Bot stopped successfully');
      }
      if (this.redis) {
        console.log('🔴 Disconnecting Redis...');
        this.redis.disconnect();
        this.redis = null;
      }
      // Очищаем токены из памяти
      this.authTokens.clear();
      // Очищаем обработанные сообщения
      this.processedMessages.clear();
    } catch (error) {
      console.error('❌ Error stopping bot:', error);
    }
  }
}

export const authBot = new AuthBotService();