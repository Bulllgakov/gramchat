import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { prisma } from '../utils/prisma';

interface InvoiceData {
  payment: any;
  subscription: any;
  bot: any;
  user: any;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<string> {
  const { payment, subscription, bot, user } = data;

  // Получаем реквизиты компании из базы
  const company = await prisma.companyDetails.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!company) {
    throw new Error('Реквизиты компании не найдены');
  }

  // Создаем директорию для счетов, если не существует
  const invoicesDir = path.join(process.cwd(), 'uploads', 'invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  // Создаем PDF документ
  const doc = new PDFDocument({ 
    size: 'A4',
    margin: 50,
    bufferPages: true
  });

  const fileName = `invoice_${payment.invoiceNumber}.pdf`;
  const filePath = path.join(invoicesDir, fileName);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Регистрируем шрифты для кириллицы
  const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'DejaVuSans.ttf');
  if (fs.existsSync(fontPath)) {
    doc.registerFont('DejaVu', fontPath);
    doc.font('DejaVu');
  }

  // Заголовок
  doc.fontSize(20)
     .text('СЧЕТ НА ОПЛАТУ', { align: 'center' })
     .moveDown();

  doc.fontSize(14)
     .text(`№ ${payment.invoiceNumber}`, { align: 'center' })
     .text(`от ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' })
     .moveDown(2);

  // Реквизиты поставщика
  doc.fontSize(12)
     .text('Поставщик:', { underline: true })
     .fontSize(10)
     .text(company.companyName)
     .text(`ИНН: ${company.inn}`)
     .text(`КПП: ${company.kpp || '-'}`)
     .text(`ОГРН: ${company.ogrn || '-'}`)
     .text(`Юридический адрес: ${company.legalAddress}`)
     .text(`Фактический адрес: ${company.legalAddress}`)
     .moveDown();

  // Банковские реквизиты
  doc.fontSize(12)
     .text('Банковские реквизиты:', { underline: true })
     .fontSize(10)
     .text(`Банк: ${company.bankName}`)
     .text(`БИК: ${company.bik}`)
     .text(`Р/с: ${company.bankAccount || '-'}`)
     .text(`К/с: ${company.correspondentAccount}`)
     .moveDown(2);

  // Реквизиты покупателя
  doc.fontSize(12)
     .text('Покупатель:', { underline: true })
     .fontSize(10)
     .text(`${user.firstName} ${user.lastName || ''}`)
     .text(`Telegram: @${user.username || user.telegramId}`)
     .moveDown(2);

  // Таблица услуг
  doc.fontSize(12)
     .text('Спецификация:', { underline: true })
     .moveDown();

  // Заголовки таблицы
  const tableTop = doc.y;
  const col1 = 50;
  const col2 = 200;
  const col3 = 350;
  const col4 = 450;

  doc.fontSize(10)
     .text('№', col1, tableTop)
     .text('Наименование', col2, tableTop)
     .text('Период', col3, tableTop)
     .text('Сумма', col4, tableTop);

  // Линия под заголовками
  doc.moveTo(col1, tableTop + 15)
     .lineTo(520, tableTop + 15)
     .stroke();

  // Данные таблицы
  const itemTop = tableTop + 25;
  const planName = subscription.planType === 'PRO' ? 'PRO' : 'MAX';
  const botTypeName = subscription.botType === 'TELEGRAM' ? 'Telegram' : 'MAX';
  const periodText = `${subscription.billingPeriod} мес.`;

  doc.text('1', col1, itemTop)
     .text(`Подписка ${planName} для бота ${botTypeName}`, col2, itemTop, { width: 140 })
     .text(periodText, col3, itemTop)
     .text(`${subscription.finalPrice} руб.`, col4, itemTop);

  // Линия под данными
  doc.moveTo(col1, itemTop + 25)
     .lineTo(520, itemTop + 25)
     .stroke();

  // Итого
  const totalsTop = itemTop + 40;
  if (subscription.discount > 0) {
    doc.text(`Сумма без скидки: ${subscription.basePrice * subscription.billingPeriod} руб.`, col3, totalsTop)
       .text(`Скидка ${subscription.discount}%: ${(subscription.basePrice * subscription.billingPeriod - subscription.finalPrice)} руб.`, col3, totalsTop + 15);
    doc.fontSize(12)
       .text(`ИТОГО К ОПЛАТЕ: ${subscription.finalPrice} руб.`, col3, totalsTop + 35);
  } else {
    doc.fontSize(12)
       .text(`ИТОГО К ОПЛАТЕ: ${subscription.finalPrice} руб.`, col3, totalsTop);
  }

  // НДС
  doc.fontSize(10)
     .text('НДС не облагается', col3, totalsTop + 55)
     .moveDown(3);

  // Подписи
  const signTop = doc.y + 30;
  doc.fontSize(10)
     .text('Руководитель _________________ /', 50, signTop)
     .text('Генеральный директор', 250, signTop)
     .text('/', 450, signTop)
     .moveDown(2)
     .text('М.П.', 250, signTop + 30);

  // Примечание
  doc.fontSize(8)
     .text('Счет действителен в течение 5 банковских дней', 50, doc.page.height - 100)
     .text('Оплата данного счета означает согласие с условиями оказания услуг', 50, doc.page.height - 85);

  doc.end();

  // Ждем завершения записи
  await new Promise<void>((resolve) => stream.on('finish', resolve));

  // Возвращаем URL для скачивания
  return `/uploads/invoices/${fileName}`;
}