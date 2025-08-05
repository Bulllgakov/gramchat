import crypto from 'crypto';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): boolean {
  const { hash, ...data } = authData;
  
  // В dev режиме пропускаем проверку для тестовых хешей
  if (process.env.NODE_ENV === 'development' && hash.startsWith('dev_hash_')) {
    console.log('🔧 Development mode: skipping Telegram auth verification');
    return true;
  }
  
  // Создаем строку для проверки
  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');
  
  // Создаем secret key из токена бота
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();
  
  // Создаем HMAC
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');
  
  // Проверяем хеш
  if (hmac !== hash) {
    return false;
  }
  
  // Проверяем давность auth_date (не старше 24 часов)
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - authData.auth_date > 86400) {
    return false;
  }
  
  return true;
}