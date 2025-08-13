
import { defineConfig } from 'vite'

import react from '@vitejs/plugin-react'



export default defineConfig({

  plugins: [react()],

  server: {

    port: 5173,
    host: '0.0.0.0', // Слушаем на всех интерфейсах для поддержки web.localhost
    
    // ВАЖНО: Больше НЕ используем proxy для /api
    // Все запросы идут напрямую на http://api.localhost:3000
    // В production используется https://api.gramchat.ru
    
    // Proxy больше не нужен, WebSocket тоже идет на api.localhost:3000

  },

})

