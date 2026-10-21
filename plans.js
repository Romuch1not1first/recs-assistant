/**
 * Тарифы подписки и надстройки мессенджеров.
 *
 * Один файл на расширение и на сайт: цена, показанная в popup, и цена в форме
 * оплаты обязаны совпадать. Разъехавшись, они превратятся в спор с покупателем,
 * который видел одно, а заплатил другое.
 *
 * Основная подписка — Pro или Max — открывает сайты знакомств. Надстройки
 * открывают мессенджеры: Instagram, Telegram или оба сразу («Все
 * мессенджеры»); продаются только к живой основной подписке.
 *
 * Идентификаторов цен здесь нет намеренно. Сумму и срок знает только сервер
 * (supabase/functions/_shared/billing.ts): иначе год покупался бы по цене
 * месяца. Отсюда наружу уходит лишь имя тарифа — `pro_monthly`, `ig_yearly`…
 *
 * Суммы и лимиты продублированы для показа. Меняете — правьте и здесь, и на
 * сервере (billing.ts — суммы, tiers.ts — лимиты): plans.test.js сверяет их.
 */

const month = { months: 1, days: 31 };
const year = { months: 12, days: 365 };

export const PLANS = [
  { id: 'pro_monthly', group: 'pro', amount: 29.99, currency: 'USD', ...month },
  { id: 'pro_yearly', group: 'pro', amount: 329, currency: 'USD', ...year },
  { id: 'max_monthly', group: 'max', amount: 59.99, currency: 'USD', ...month },
  { id: 'max_yearly', group: 'max', amount: 659, currency: 'USD', ...year },
  { id: 'ig_monthly', group: 'instagram', amount: 9.99, currency: 'USD', ...month },
  { id: 'ig_yearly', group: 'instagram', amount: 109, currency: 'USD', ...year },
  { id: 'tg_monthly', group: 'telegram', amount: 9.99, currency: 'USD', ...month },
  { id: 'tg_yearly', group: 'telegram', amount: 109, currency: 'USD', ...year },
  { id: 'msg_monthly', group: 'messengers', amount: 14.99, currency: 'USD', ...month },
  { id: 'msg_yearly', group: 'messengers', amount: 164, currency: 'USD', ...year },
];

/** Основная подписка — тарифы; остальное — надстройки. */
export const TIERS = ['pro', 'max'];
export const ADDONS = ['instagram', 'telegram', 'messengers'];

/**
 * Лимиты. Анализ анкеты — оценка фото моделью, лимит на неделю (с понедельника
 * 00:00 UTC). Сообщение — любой сгенерированный текст, по фото считается за
 * `PHOTO_WEIGHT`; лимит на два дня (пары дней от 00:00 UTC). У надстроек
 * анализов нет: анкеты смотрят на сайтах знакомств.
 */
export const LIMITS = {
  pro: { analyses: 700, messages: 100 },
  max: { analyses: 1400, messages: 200 },
  instagram: { messages: 100 },
  telegram: { messages: 100 },
  messengers: { messages: 150 },
};

/** Длина окна лимита в днях — та же, что у сервера (tiers.ts). */
export const PERIODS = { analyses: 7, messages: 2 };

export const PHOTO_WEIGHT = 3;

/** Прежние имена (ссылки и старые версии расширения) — тот же срок у Pro. */
const LEGACY = { monthly: 'pro_monthly', yearly: 'pro_yearly' };

/** Тариф по имени. null — имя не из списка, дальше пускать нельзя. */
export const planById = (id) =>
  PLANS.find((p) => p.id === id) ?? PLANS.find((p) => p.id === LEGACY[id]) ?? null;

/** Тариф по умолчанию: с него начинается выбор. */
export const DEFAULT_PLAN = 'pro_monthly';

/** Месяц и год одного продукта: `planFor('max', 12)` → max_yearly. */
export const planFor = (group, months = 1) =>
  PLANS.find((p) => p.group === group && p.months === months) ?? null;

const SIGNS = { USD: '$', EUR: '€', GBP: '£' };

/** «$29.99» — сумма со знаком валюты. */
export const priceLabel = (plan) =>
  `${SIGNS[plan.currency] ?? ''}${plan.amount}${SIGNS[plan.currency] ? '' : ` ${plan.currency}`}`;

/**
 * Насколько годовой выгоднее двенадцати месячных, в процентах.
 *
 * Считаем, а не пишем числом: при смене цены подпись «выгоднее на 8%» иначе
 * осталась бы прежней и начала бы врать.
 */
export function yearlySavings(group = 'pro', plans = PLANS) {
  const m = plans.find((p) => p.group === group && p.months === 1);
  const y = plans.find((p) => p.group === group && p.months === 12);
  if (!m || !y || m.currency !== y.currency) return 0;

  const full = m.amount * 12;
  return full > y.amount ? Math.round((1 - y.amount / full) * 100) : 0;
}

/** Сколько месяцев года — в подарок: 12 месячных минус цена года в месяцах. */
export function freeMonths(group = 'pro', plans = PLANS) {
  const m = plans.find((p) => p.group === group && p.months === 1);
  const y = plans.find((p) => p.group === group && p.months === 12);
  if (!m || !y || m.currency !== y.currency) return 0;
  return Math.max(0, Math.round(12 - y.amount / m.amount));
}
