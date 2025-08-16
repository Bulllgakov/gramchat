import { Router } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

// Получить HTML документ с реквизитами
router.get('/:type', async (req: any, res: any, next: any) => {
  try {
    const { type } = req.params;
    
    // Получаем реквизиты компании
    const company = await prisma.companyDetails.findFirst({
      orderBy: { updatedAt: 'desc' }
    });
    
    // Дефолтные реквизиты если не настроены
    const details = company || {
      companyName: 'ООО "ГрамЧат"',
      legalForm: 'ООО',
      inn: '0000000000',
      kpp: '000000000',
      ogrn: '0000000000000',
      legalAddress: 'Россия, г. Москва',
      bankName: 'Тбанк',
      bik: '044525555',
      settlementAccount: '00000000000000000000',
      phone: '+7 (800) 000-00-00',
      email: 'info@gramchat.ru',
      directorName: 'Иванов Иван Иванович',
      directorPosition: 'Генеральный директор',
      directorBasis: 'Устава',
      website: 'https://gramchat.ru'
    };
    
    let html = '';
    
    switch (type) {
      case 'requisites':
        html = generateRequisitesPage(details);
        break;
      case 'terms':
        html = generateTermsPage(details);
        break;
      case 'privacy':
        html = generatePrivacyPage(details);
        break;
      case 'offer':
        html = generateOfferPage(details);
        break;
      default:
        return res.status(404).send('Документ не найден');
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    next(error);
  }
});

function generateRequisitesPage(company: any) {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Реквизиты компании - GramChat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .document { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 30px; font-size: 28px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1e40af; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { flex: 0 0 200px; color: #6b7280; font-weight: 500; }
    .info-value { flex: 1; color: #111827; }
    .bank-link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .bank-link:hover { background: #1e40af; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="document">
      <h1>Реквизиты компании</h1>
      
      <div class="section">
        <h2>Основная информация</h2>
        <div class="info-row">
          <div class="info-label">Наименование:</div>
          <div class="info-value">${company.legalForm ? company.legalForm + ' ' : ''}${company.companyName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">ИНН:</div>
          <div class="info-value">${company.inn}</div>
        </div>
        ${company.kpp ? `
        <div class="info-row">
          <div class="info-label">КПП:</div>
          <div class="info-value">${company.kpp}</div>
        </div>` : ''}
        ${company.ogrn ? `
        <div class="info-row">
          <div class="info-label">ОГРН:</div>
          <div class="info-value">${company.ogrn}</div>
        </div>` : ''}
      </div>
      
      <div class="section">
        <h2>Юридический адрес</h2>
        <div class="info-row">
          <div class="info-label">Адрес:</div>
          <div class="info-value">${company.legalAddress}</div>
        </div>
        ${company.postalAddress ? `
        <div class="info-row">
          <div class="info-label">Почтовый адрес:</div>
          <div class="info-value">${company.postalAddress}</div>
        </div>` : ''}
      </div>
      
      <div class="section">
        <h2>Банковские реквизиты</h2>
        <div class="info-row">
          <div class="info-label">Банк:</div>
          <div class="info-value">${company.bankName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">БИК:</div>
          <div class="info-value">${company.bik}</div>
        </div>
        ${company.correspondentAccount ? `
        <div class="info-row">
          <div class="info-label">Корр. счет:</div>
          <div class="info-value">${company.correspondentAccount}</div>
        </div>` : ''}
        <div class="info-row">
          <div class="info-label">Расчетный счет:</div>
          <div class="info-value">${company.settlementAccount}</div>
        </div>
      </div>
      
      <div class="section">
        <h2>Контактная информация</h2>
        <div class="info-row">
          <div class="info-label">Телефон:</div>
          <div class="info-value">${company.phone}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${company.email}</div>
        </div>
        ${company.website ? `
        <div class="info-row">
          <div class="info-label">Сайт:</div>
          <div class="info-value"><a href="${company.website}" target="_blank">${company.website}</a></div>
        </div>` : ''}
      </div>
      
      <div class="section">
        <h2>Руководитель</h2>
        <div class="info-row">
          <div class="info-label">ФИО:</div>
          <div class="info-value">${company.directorName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Должность:</div>
          <div class="info-value">${company.directorPosition}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Действует на основании:</div>
          <div class="info-value">${company.directorBasis}</div>
        </div>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${company.companyName}. Все права защищены.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateTermsPage(company: any) {
  const currentDate = new Date().toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Пользовательское соглашение - GramChat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.8; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .document { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 20px; font-size: 28px; text-align: center; }
    .date { text-align: center; color: #6b7280; margin-bottom: 30px; }
    h2 { color: #1e40af; margin: 30px 0 15px; font-size: 20px; }
    p { margin-bottom: 15px; text-align: justify; }
    ol, ul { margin: 15px 0 15px 30px; }
    li { margin-bottom: 10px; }
    .company-info { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="document">
      <h1>Пользовательское соглашение</h1>
      <div class="date">Дата вступления в силу: ${currentDate}</div>
      
      <h2>1. Общие положения</h2>
      <p>1.1. Настоящее Пользовательское соглашение (далее – Соглашение) регулирует отношения между ${company.companyName} (далее – Компания) и пользователем сервиса GramChat (далее – Пользователь).</p>
      <p>1.2. Используя сервис GramChat, Пользователь подтверждает, что ознакомился с условиями настоящего Соглашения и принимает их в полном объеме.</p>
      
      <h2>2. Описание сервиса</h2>
      <p>2.1. GramChat – это платформа для управления коммуникациями с клиентами через мессенджеры Telegram и MAX.</p>
      <p>2.2. Сервис предоставляет следующие возможности:</p>
      <ul>
        <li>Подключение и управление ботами в мессенджерах</li>
        <li>Обработка сообщений от клиентов</li>
        <li>Управление диалогами и их распределение между менеджерами</li>
        <li>Аналитика и отчетность</li>
      </ul>
      
      <h2>3. Права и обязанности сторон</h2>
      <p>3.1. Компания обязуется:</p>
      <ul>
        <li>Предоставить доступ к функционалу сервиса в соответствии с выбранным тарифным планом</li>
        <li>Обеспечить техническую поддержку пользователей</li>
        <li>Соблюдать конфиденциальность данных пользователей</li>
      </ul>
      
      <p>3.2. Пользователь обязуется:</p>
      <ul>
        <li>Использовать сервис в соответствии с законодательством РФ</li>
        <li>Не передавать доступ к аккаунту третьим лицам</li>
        <li>Своевременно оплачивать выбранный тарифный план</li>
      </ul>
      
      <h2>4. Тарифы и оплата</h2>
      <p>4.1. Сервис предоставляется на основе следующих тарифных планов:</p>
      <ul>
        <li><strong>FREE</strong> – бесплатный тариф с базовым функционалом</li>
        <li><strong>PRO</strong> – 990₽ за бота в месяц</li>
        <li><strong>MAX</strong> – 3000₽ за бота в месяц</li>
      </ul>
      <p>4.2. Оплата производится через платежную систему Тбанк.</p>
      
      <h2>5. Конфиденциальность</h2>
      <p>5.1. Компания обязуется не разглашать персональные данные пользователей третьим лицам.</p>
      <p>5.2. Подробная информация о обработке персональных данных содержится в Политике конфиденциальности.</p>
      
      <h2>6. Ответственность сторон</h2>
      <p>6.1. Компания не несет ответственности за перебои в работе сервиса, вызванные техническими неполадками у третьих лиц.</p>
      <p>6.2. Пользователь несет полную ответственность за содержание сообщений, отправляемых через сервис.</p>
      
      <h2>7. Изменение условий</h2>
      <p>7.1. Компания оставляет за собой право изменять условия настоящего Соглашения.</p>
      <p>7.2. Актуальная версия Соглашения всегда доступна по адресу: https://gramchat.ru/docs/terms</p>
      
      <div class="company-info">
        <h2>8. Реквизиты компании</h2>
        <p><strong>${company.companyName}</strong></p>
        <p>ИНН: ${company.inn}</p>
        ${company.kpp ? `<p>КПП: ${company.kpp}</p>` : ''}
        <p>Юридический адрес: ${company.legalAddress}</p>
        <p>Email: ${company.email}</p>
        <p>Телефон: ${company.phone}</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${company.companyName}. Все права защищены.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generatePrivacyPage(company: any) {
  const currentDate = new Date().toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Политика конфиденциальности - GramChat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.8; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .document { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 20px; font-size: 28px; text-align: center; }
    .date { text-align: center; color: #6b7280; margin-bottom: 30px; }
    h2 { color: #1e40af; margin: 30px 0 15px; font-size: 20px; }
    p { margin-bottom: 15px; text-align: justify; }
    ol, ul { margin: 15px 0 15px 30px; }
    li { margin-bottom: 10px; }
    .company-info { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="document">
      <h1>Политика конфиденциальности</h1>
      <div class="date">Дата вступления в силу: ${currentDate}</div>
      
      <h2>1. Общие положения</h2>
      <p>1.1. Настоящая Политика конфиденциальности определяет порядок обработки и защиты ${company.companyName} (далее – Оператор) информации о физических лицах (далее – Пользователи), использующих сервис GramChat.</p>
      <p>1.2. Целью настоящей Политики конфиденциальности является обеспечение надлежащей защиты информации о Пользователях, в том числе их персональных данных.</p>
      
      <h2>2. Персональные данные</h2>
      <p>2.1. В рамках использования сервиса Оператор может собирать следующие данные:</p>
      <ul>
        <li>Имя и фамилия пользователя</li>
        <li>Telegram ID и username</li>
        <li>Контактный телефон</li>
        <li>Адрес электронной почты</li>
        <li>Данные о подключенных ботах</li>
        <li>История сообщений и диалогов</li>
      </ul>
      
      <h2>3. Цели обработки персональных данных</h2>
      <p>3.1. Персональные данные обрабатываются в следующих целях:</p>
      <ul>
        <li>Предоставление доступа к функционалу сервиса</li>
        <li>Идентификация и авторизация пользователей</li>
        <li>Техническая поддержка пользователей</li>
        <li>Улучшение качества сервиса</li>
        <li>Выполнение требований законодательства РФ</li>
      </ul>
      
      <h2>4. Правовые основания обработки</h2>
      <p>4.1. Обработка персональных данных осуществляется на основании:</p>
      <ul>
        <li>Согласия Пользователя на обработку персональных данных</li>
        <li>Договора между Оператором и Пользователем</li>
        <li>Федерального закона от 27.07.2006 N 152-ФЗ "О персональных данных"</li>
      </ul>
      
      <h2>5. Защита персональных данных</h2>
      <p>5.1. Оператор принимает необходимые организационные и технические меры для защиты персональных данных от неправомерного доступа, уничтожения, изменения, блокирования, копирования, распространения.</p>
      <p>5.2. Доступ к персональным данным имеют только уполномоченные сотрудники Оператора.</p>
      
      <h2>6. Передача данных третьим лицам</h2>
      <p>6.1. Персональные данные не передаются третьим лицам без согласия Пользователя, за исключением случаев, предусмотренных законодательством РФ.</p>
      <p>6.2. Для обеспечения работы сервиса данные могут обрабатываться следующими сервисами:</p>
      <ul>
        <li>Telegram API – для работы с ботами</li>
        <li>Тбанк – для обработки платежей</li>
      </ul>
      
      <h2>7. Права пользователей</h2>
      <p>7.1. Пользователь имеет право:</p>
      <ul>
        <li>Получить информацию об обрабатываемых персональных данных</li>
        <li>Требовать уточнения, блокирования или уничтожения персональных данных</li>
        <li>Отозвать согласие на обработку персональных данных</li>
      </ul>
      
      <h2>8. Cookies</h2>
      <p>8.1. Сервис использует файлы cookies для улучшения работы и аналитики.</p>
      <p>8.2. Пользователь может отключить cookies в настройках браузера.</p>
      
      <h2>9. Изменение политики</h2>
      <p>9.1. Оператор оставляет за собой право вносить изменения в настоящую Политику.</p>
      <p>9.2. Актуальная версия Политики доступна по адресу: https://gramchat.ru/docs/privacy</p>
      
      <div class="company-info">
        <h2>10. Контактная информация</h2>
        <p>По вопросам обработки персональных данных обращайтесь:</p>
        <p><strong>${company.companyName}</strong></p>
        <p>Email: ${company.email}</p>
        <p>Телефон: ${company.phone}</p>
        <p>Адрес: ${company.legalAddress}</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${company.companyName}. Все права защищены.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateOfferPage(company: any) {
  const currentDate = new Date().toLocaleDateString('ru-RU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Договор оферты - GramChat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.8; color: #333; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .document { background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2563eb; margin-bottom: 20px; font-size: 28px; text-align: center; }
    .date { text-align: center; color: #6b7280; margin-bottom: 30px; }
    h2 { color: #1e40af; margin: 30px 0 15px; font-size: 20px; }
    p { margin-bottom: 15px; text-align: justify; }
    ol, ul { margin: 15px 0 15px 30px; }
    li { margin-bottom: 10px; }
    .tariff-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .tariff-table th, .tariff-table td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
    .tariff-table th { background: #f9fafb; font-weight: 600; }
    .company-info { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 30px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="document">
      <h1>Публичная оферта</h1>
      <div class="date">Дата публикации: ${currentDate}</div>
      
      <h2>1. Термины и определения</h2>
      <p>1.1. <strong>Исполнитель</strong> – ${company.companyName}, ИНН ${company.inn}.</p>
      <p>1.2. <strong>Заказчик</strong> – физическое или юридическое лицо, акцептовавшее настоящую оферту.</p>
      <p>1.3. <strong>Сервис</strong> – платформа GramChat для управления коммуникациями с клиентами.</p>
      <p>1.4. <strong>Акцепт</strong> – полное и безоговорочное принятие условий настоящей оферты.</p>
      
      <h2>2. Предмет договора</h2>
      <p>2.1. Исполнитель обязуется предоставить Заказчику доступ к функционалу Сервиса GramChat, а Заказчик обязуется оплатить услуги в соответствии с выбранным тарифным планом.</p>
      <p>2.2. Услуги включают:</p>
      <ul>
        <li>Предоставление доступа к платформе GramChat</li>
        <li>Возможность подключения ботов Telegram и MAX</li>
        <li>Обработка и хранение сообщений</li>
        <li>Техническая поддержка</li>
      </ul>
      
      <h2>3. Тарифные планы</h2>
      <p>3.1. Исполнитель предоставляет следующие тарифные планы:</p>
      
      <table class="tariff-table">
        <thead>
          <tr>
            <th>Тариф</th>
            <th>Стоимость</th>
            <th>Боты</th>
            <th>Диалоги</th>
            <th>Сотрудники</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>FREE</strong></td>
            <td>Бесплатно</td>
            <td>1 Telegram + 1 MAX</td>
            <td>100/месяц</td>
            <td>1 владелец + 1 менеджер</td>
          </tr>
          <tr>
            <td><strong>PRO</strong></td>
            <td>990₽/бот/месяц</td>
            <td>Безлимит</td>
            <td>500/бот</td>
            <td>Безлимит</td>
          </tr>
          <tr>
            <td><strong>MAX</strong></td>
            <td>3000₽/бот/месяц</td>
            <td>Безлимит</td>
            <td>Безлимит</td>
            <td>Безлимит</td>
          </tr>
        </tbody>
      </table>
      
      <p>3.2. При первом подключении тарифа PRO предоставляется бесплатный пробный период 14 дней.</p>
      
      <h2>4. Порядок оплаты</h2>
      <p>4.1. Оплата производится авансом за месяц использования сервиса.</p>
      <p>4.2. Способы оплаты:</p>
      <ul>
        <li>Банковская карта через систему Тбанк</li>
        <li>Безналичный расчет для юридических лиц</li>
      </ul>
      <p>4.3. Услуги считаются оказанными в полном объеме в последний день оплаченного периода.</p>
      
      <h2>5. Акцепт оферты</h2>
      <p>5.1. Акцептом настоящей оферты является:</p>
      <ul>
        <li>Регистрация в сервисе GramChat</li>
        <li>Оплата выбранного тарифного плана</li>
      </ul>
      <p>5.2. С момента акцепта настоящая оферта считается договором между Исполнителем и Заказчиком.</p>
      
      <h2>6. Права и обязанности сторон</h2>
      <p>6.1. Исполнитель обязуется:</p>
      <ul>
        <li>Обеспечить доступность сервиса не менее 99% времени в месяц</li>
        <li>Предоставить техническую поддержку</li>
        <li>Уведомлять об изменениях в работе сервиса</li>
      </ul>
      
      <p>6.2. Заказчик обязуется:</p>
      <ul>
        <li>Своевременно вносить оплату</li>
        <li>Соблюдать правила использования сервиса</li>
        <li>Не нарушать права третьих лиц</li>
      </ul>
      
      <h2>7. Ответственность сторон</h2>
      <p>7.1. Стороны несут ответственность в соответствии с законодательством РФ.</p>
      <p>7.2. Исполнитель не несет ответственности за упущенную выгоду Заказчика.</p>
      
      <h2>8. Срок действия</h2>
      <p>8.1. Договор вступает в силу с момента акцепта и действует до полного исполнения обязательств.</p>
      <p>8.2. Договор может быть расторгнут по инициативе любой из сторон с уведомлением за 10 дней.</p>
      
      <h2>9. Изменение условий</h2>
      <p>9.1. Исполнитель вправе изменять условия оферты в одностороннем порядке.</p>
      <p>9.2. Изменения вступают в силу через 10 дней после публикации.</p>
      
      <div class="company-info">
        <h2>10. Реквизиты Исполнителя</h2>
        <p><strong>${company.companyName}</strong></p>
        <p>ИНН: ${company.inn}</p>
        ${company.kpp ? `<p>КПП: ${company.kpp}</p>` : ''}
        ${company.ogrn ? `<p>ОГРН: ${company.ogrn}</p>` : ''}
        <p>Юридический адрес: ${company.legalAddress}</p>
        <p>Банк: ${company.bankName}</p>
        <p>БИК: ${company.bik}</p>
        <p>Р/с: ${company.settlementAccount}</p>
        ${company.correspondentAccount ? `<p>К/с: ${company.correspondentAccount}</p>` : ''}
        <p>Email: ${company.email}</p>
        <p>Телефон: ${company.phone}</p>
        <p>${company.directorPosition}: ${company.directorName}</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${company.companyName}. Все права защищены.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default router;