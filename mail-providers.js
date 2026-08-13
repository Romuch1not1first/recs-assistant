/**
 * Куда идти читать письмо: домен почты → веб-интерфейс этой почты.
 *
 * Нужно после регистрации. «Проверьте почту» — плохой конец разговора: человек
 * уходит из окна, ищет вкладку, иногда просто забывает. Кнопка, открывающая
 * его же ящик, убирает этот шаг.
 *
 * Ведём на входящие, а не на поиск письма: адрес отправителя зависит от того,
 * подключён ли свой SMTP, и ссылка с поиском ломалась бы при его смене.
 *
 * Чего этот список не умеет: узнавать корпоративные домены на Google Workspace
 * или Яндекс 360. С виду это `@фирма.ру`, и определить провайдера из браузера
 * нельзя — для них кнопки не будет, только текст.
 */

const PROVIDERS = [
  { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox',
    domains: ['gmail.com', 'googlemail.com'] },
  { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox',
    domains: ['outlook.com', 'outlook.fr', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.ru', 'msn.com'] },
  { name: 'Ukr.net', url: 'https://mail.ukr.net/desktop',
    domains: ['ukr.net'] },
  { name: 'i.ua', url: 'https://mail.i.ua/',
    domains: ['i.ua'] },
  { name: 'Meta.ua', url: 'https://mail.meta.ua/',
    domains: ['meta.ua'] },
  { name: 'Yandex', url: 'https://mail.yandex.ru/',
    domains: ['yandex.ru', 'yandex.com', 'yandex.ua', 'yandex.by', 'yandex.kz', 'ya.ru'] },
  { name: 'Mail.ru', url: 'https://e.mail.ru/inbox/',
    domains: ['mail.ru', 'bk.ru', 'inbox.ru', 'list.ru', 'internet.ru'] },
  { name: 'Rambler', url: 'https://mail.rambler.ru/',
    domains: ['rambler.ru', 'lenta.ru', 'autorambler.ru', 'myrambler.ru', 'ro.ru'] },
  { name: 'Proton Mail', url: 'https://mail.proton.me/u/0/inbox',
    domains: ['proton.me', 'protonmail.com', 'protonmail.ch', 'pm.me'] },
  { name: 'iCloud', url: 'https://www.icloud.com/mail/',
    domains: ['icloud.com', 'me.com', 'mac.com'] },
  { name: 'Yahoo', url: 'https://mail.yahoo.com/',
    domains: ['yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com'] },
  { name: 'GMX', url: 'https://www.gmx.com/',
    domains: ['gmx.com', 'gmx.de', 'gmx.net'] },
  { name: 'Web.de', url: 'https://web.de/',
    domains: ['web.de'] },
  { name: 'AOL', url: 'https://mail.aol.com/',
    domains: ['aol.com'] },
  { name: 'Zoho', url: 'https://mail.zoho.com/',
    domains: ['zoho.com', 'zohomail.com'] },
  { name: 'Tutanota', url: 'https://app.tuta.com/',
    domains: ['tutanota.com', 'tuta.io', 'tutamail.com'] },
];

/** Домен → провайдер. Собираем один раз: поиск перебором шёл бы на каждую букву. */
const BY_DOMAIN = new Map(
  PROVIDERS.flatMap((p) => p.domains.map((d) => [d, { name: p.name, url: p.url }]))
);

/** Домен из адреса: `Вася+tinder@Gmail.com` → `gmail.com`. */
export function domainOf(email) {
  const at = String(email ?? '').trim().lastIndexOf('@');
  if (at < 1) return '';
  return String(email).trim().slice(at + 1).toLowerCase();
}

/**
 * Какой почтой пользуется человек.
 *
 * @returns {?{name:string, url:string}} null — домен незнаком, вести некуда.
 */
export function mailProvider(email) {
  return BY_DOMAIN.get(domainOf(email)) ?? null;
}

/** Адрес ящика по почте — для фона, чтобы наружу не ходил произвольный URL. */
export const mailboxUrl = (email) => mailProvider(email)?.url ?? null;
