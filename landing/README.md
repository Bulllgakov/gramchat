# GramChat Landing Page

Профессиональный лендинг для платформы управления поддержкой клиентов в Telegram.

## 📁 Структура проекта

```
landing/
├── index.html          # Главная страница
├── 404.html           # Страница ошибки 404
├── 50x.html           # Страница ошибки сервера
├── css/
│   └── style.css      # Основные стили
├── js/
│   └── main.js        # JavaScript функционал
├── images/            # Изображения (требуется добавить)
├── nginx.conf         # Конфигурация Nginx
└── README.md          # Документация
```

## 🚀 Развертывание

### Автоматическое развертывание

```bash
# Из корневой директории проекта
./deploy-landing.sh
```

### Ручное развертывание на сервере

1. Скопировать файлы на сервер:
```bash
sudo cp -r /home/ulat/gramchat/landing/* /var/www/gramchat-landing/
```

2. Настроить Nginx:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/gramchat-landing
sudo ln -s /etc/nginx/sites-available/gramchat-landing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. Настроить SSL (если еще не настроен):
```bash
sudo certbot --nginx -d gramchat.ru -d www.gramchat.ru
```

## 🎨 Особенности дизайна

- **Цветовая схема**: Telegram синий (#0088CC) + зеленый успеха (#28A745)
- **Шрифт**: Inter (Google Fonts)
- **Иконки**: Bootstrap Icons
- **Анимации**: CSS transitions + JavaScript scroll animations
- **Адаптивность**: Mobile-first подход

## ✨ Функционал

### Реализовано:
- ✅ Адаптивная навигация с мобильным меню
- ✅ Hero секция с анимированными элементами
- ✅ Секции проблем и решений
- ✅ Сетка функций (8 ключевых возможностей)
- ✅ Пошаговая инструкция "Как это работает"
- ✅ Roadmap развития (Q1-Q2 2025)
- ✅ Тарифные планы (Старт/Бизнес/Корпоративный)
- ✅ Отзывы клиентов
- ✅ FAQ секция с аккордеоном
- ✅ Форма подписки на новости
- ✅ Footer с полной навигацией
- ✅ Smooth scroll и parallax эффекты
- ✅ Анимации при скролле
- ✅ Счетчики для цифр

### Требует добавления:
- 📷 Изображения и скриншоты интерфейса
- 📊 Интеграция с аналитикой (GA, Яндекс.Метрика)
- 📧 Backend для формы подписки
- 🎥 Демо видео
- 🔍 SEO оптимизация и meta теги

## 📸 Необходимые изображения

Добавьте следующие изображения в папку `images/`:

1. `favicon.png` - Иконка сайта (32x32)
2. `og-image.png` - Open Graph изображение (1200x630)
3. `hero-dashboard.png` - Скриншот панели управления
4. `solution-1.png` - Иллюстрация единой панели
5. `solution-2.png` - Иллюстрация командной работы

## 🔧 Настройка

### Изменение контента:
- Тексты: редактируйте `index.html`
- Стили: модифицируйте `css/style.css`
- Интерактив: настройте `js/main.js`

### Изменение цветов:
В файле `css/style.css` измените CSS переменные:
```css
:root {
  --primary-color: #0088CC;  /* Основной цвет */
  --success-color: #28A745;  /* Цвет успеха */
  --dark-color: #212529;     /* Темный текст */
}
```

## 📱 Поддержка браузеров

- Chrome/Edge (последние 2 версии)
- Firefox (последние 2 версии)
- Safari 12+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🛠 Технологии

- HTML5 + семантическая разметка
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Bootstrap Icons
- Google Fonts (Inter)

## 📈 Производительность

Рекомендации для оптимизации:
1. Сжать изображения (WebP формат)
2. Минифицировать CSS/JS
3. Включить Gzip сжатие (настроено в nginx.conf)
4. Настроить кеширование (настроено в nginx.conf)
5. Использовать CDN для статики

## 📞 Контакты

По вопросам развертывания и настройки обращайтесь к команде разработки GramChat.