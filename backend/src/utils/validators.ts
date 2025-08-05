// Функция для нормализации username бота
export function normalizeBotUsername(username: string): string {
  // Удаляем @ в начале если есть
  let normalized = username.trim();
  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }
  
  // Удаляем все недопустимые символы (оставляем только буквы, цифры и подчеркивания)
  normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '');
  
  return normalized;
}

// Функция валидации username бота
export function validateBotUsername(username: string): boolean {
  const normalized = normalizeBotUsername(username);
  
  // Username должен быть от 5 до 32 символов
  if (normalized.length < 5 || normalized.length > 32) {
    return false;
  }
  
  // Username должен заканчиваться на 'bot' или 'Bot'
  if (!normalized.toLowerCase().endsWith('bot')) {
    return false;
  }
  
  // Username должен содержать только латинские буквы, цифры и подчеркивания
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) {
    return false;
  }
  
  return true;
}

// Функция проверки токена бота (базовая проверка формата)
export function validateBotToken(token: string): boolean {
  // Токен должен быть в формате: цифры:буквыИцифры
  const tokenRegex = /^\d+:[a-zA-Z0-9_-]+$/;
  return tokenRegex.test(token);
}