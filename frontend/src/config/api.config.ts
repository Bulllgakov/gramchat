// ВАЖНО: Всегда используем поддомены для API, НЕ используем префикс /api
// В локальной разработке: http://api.localhost:3000
// В production: https://api.gramchat.ru

const getBaseApiUrl = () => {
  const hostname = window.location.hostname;
  
  // Локальная разработка - используем поддомен api.localhost
  if (hostname === 'web.localhost' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://api.localhost:3000';
  }
  
  // Production - используем поддомен api.gramchat.ru
  return 'https://api.gramchat.ru';
};

const getWebSocketUrl = () => {
  const hostname = window.location.hostname;
  
  // Локальная разработка
  if (hostname === 'web.localhost' || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://api.localhost:3000';
  }
  
  // Production
  return 'https://api.gramchat.ru';
};

export const API_CONFIG = {
  API_URL: getBaseApiUrl(),
  WS_URL: getWebSocketUrl(),
};

export const getApiUrl = () => API_CONFIG.API_URL;
export const getWsUrl = () => API_CONFIG.WS_URL;