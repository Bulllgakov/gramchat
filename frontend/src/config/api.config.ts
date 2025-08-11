export const API_CONFIG = {
  API_URL: window.location.hostname === 'localhost' ? '/api' : 'https://api.gramchat.ru',
  WS_URL: window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://api.gramchat.ru',
};

export const getApiUrl = () => API_CONFIG.API_URL;
export const getWsUrl = () => API_CONFIG.WS_URL;