/**
 * Тарифы подписки.
 *
 * Один файл на расширение и на сайт: цена, показанная в popup, и цена в форме
 * оплаты обязаны совпадать. Разъехавшись, они превратятся в спор с покупателем,
 * который видел одно, а заплатил другое.
 *
 * Идентификаторы цен Paddle публичны по своей природе — они и так уходят в
 * браузер при открытии чек-аута. Секретов здесь нет и быть не должно.
 *
 * Суммы продублированы из Paddle руками: подтянуть их оттуда можно только через
 * Paddle.js, а он есть на сайте и отсутствует в popup. Меняете цену в Paddle —
 * поменяйте и здесь.
 */

export const PLANS = [
  {
    id: 'monthly',
    priceId: 'pri_01m00hj6cxahy7803kpmdzxrmp',
    amount: 20,
    currency: 'USD',
    months: 1,
  },
  {
    id: 'yearly',
    priceId: 'pri_01m00hmpyry3bf8p6206qam9c8',
    amount: 199,
    currency: 'USD',
    months: 12,
  },
];

/** Тариф по имени. null — имя не из списка, дальше пускать нельзя. */
export const planById = (id) => PLANS.find((p) => p.id === id) ?? null;

/** Тариф по умолчанию: с него начинается выбор. */
export const DEFAULT_PLAN = 'monthly';

const SIGNS = { USD: '$', EUR: '€', GBP: '£' };

/** «$20» — сумма со знаком валюты. */
export const priceLabel = (plan) =>
  `${SIGNS[plan.currency] ?? ''}${plan.amount}${SIGNS[plan.currency] ? '' : ` ${plan.currency}`}`;

/**
 * Насколько годовой выгоднее двенадцати месячных, в процентах.
 *
 * Считаем, а не пишем числом: при смене цены подпись «выгоднее на 17%» иначе
 * осталась бы прежней и начала бы врать.
 */
export function yearlySavings(plans = PLANS) {
  const month = plans.find((p) => p.months === 1);
  const year = plans.find((p) => p.months === 12);
  if (!month || !year || month.currency !== year.currency) return 0;

  const full = month.amount * 12;
  return full > year.amount ? Math.round((1 - year.amount / full) * 100) : 0;
}
