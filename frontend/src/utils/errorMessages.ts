// Дружелюбные сообщения об ошибках на русском языке
export const errorMessages: Record<string, string> = {
  // Сетевые ошибки
  'NETWORK_ERROR': 'Проблема с интернет-соединением. Проверьте подключение к сети',
  'TIMEOUT': 'Превышено время ожидания ответа от сервера',
  'CONNECTION_REFUSED': 'Не удается подключиться к серверу',
  
  // Ошибки авторизации
  'UNAUTHORIZED': 'Необходимо войти в систему',
  'FORBIDDEN': 'У вас нет доступа к этому ресурсу',
  'TOKEN_EXPIRED': 'Сессия истекла. Пожалуйста, войдите снова',
  'INVALID_CREDENTIALS': 'Неверные учетные данные',
  
  // Ошибки валидации
  'VALIDATION_ERROR': 'Проверьте правильность введенных данных',
  'REQUIRED_FIELD': 'Это поле обязательно для заполнения',
  'INVALID_FORMAT': 'Неверный формат данных',
  
  // Ошибки сервера
  'SERVER_ERROR': 'Произошла ошибка на сервере. Попробуйте позже',
  'SERVICE_UNAVAILABLE': 'Сервис временно недоступен',
  'RATE_LIMIT': 'Слишком много запросов. Подождите немного',
  
  // Бизнес-логика
  'DIALOG_NOT_FOUND': 'Диалог не найден',
  'USER_NOT_FOUND': 'Пользователь не найден',
  'SHOP_NOT_FOUND': 'Магазин не найден',
  'PERMISSION_DENIED': 'У вас нет прав для выполнения этого действия',
  'ALREADY_EXISTS': 'Такая запись уже существует',
  
  // Telegram специфичные
  'BOT_NOT_RESPONDING': 'Бот Telegram не отвечает',
  'TELEGRAM_API_ERROR': 'Ошибка при работе с Telegram API',
  'INVALID_BOT_TOKEN': 'Неверный токен бота',
  
  // Файлы
  'FILE_TOO_LARGE': 'Файл слишком большой. Максимальный размер: 10 МБ',
  'UNSUPPORTED_FILE_TYPE': 'Неподдерживаемый тип файла',
  'UPLOAD_FAILED': 'Не удалось загрузить файл',
  
  // По умолчанию
  'UNKNOWN_ERROR': 'Произошла неизвестная ошибка'
};

// Функция для получения дружелюбного сообщения об ошибке
export function getFriendlyErrorMessage(error: any): string {
  // Если уже есть дружелюбное сообщение
  if (typeof error === 'string' && errorMessages[error]) {
    return errorMessages[error];
  }
  
  // Проверяем код ошибки
  if (error?.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }
  
  // Проверяем HTTP статусы
  if (error?.status) {
    switch (error.status) {
      case 400:
        return 'Неверный запрос. Проверьте введенные данные';
      case 401:
        return errorMessages['UNAUTHORIZED'];
      case 403:
        return errorMessages['FORBIDDEN'];
      case 404:
        return 'Запрашиваемый ресурс не найден';
      case 429:
        return errorMessages['RATE_LIMIT'];
      case 500:
        return errorMessages['SERVER_ERROR'];
      case 502:
      case 503:
        return errorMessages['SERVICE_UNAVAILABLE'];
      default:
        if (error.status >= 500) {
          return errorMessages['SERVER_ERROR'];
        }
    }
  }
  
  // Проверяем сообщение об ошибке
  const message = error?.message || error?.error || '';
  
  // Поиск ключевых слов в сообщении
  if (message.toLowerCase().includes('network')) {
    return errorMessages['NETWORK_ERROR'];
  }
  if (message.toLowerCase().includes('timeout')) {
    return errorMessages['TIMEOUT'];
  }
  if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('auth')) {
    return errorMessages['UNAUTHORIZED'];
  }
  
  // Если есть сообщение, но оно не распознано
  if (message && message.length < 100) {
    return message;
  }
  
  // По умолчанию
  return errorMessages['UNKNOWN_ERROR'];
}