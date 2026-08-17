/**
 * Тарифы подписки.
 *
 * Один файл на расширение и на сайт: цена, показанная в popup, и цена в форме
 * оплаты обязаны совпадать. Разъехавшись, они превратятся в спор с покупателем,
 * который видел одно, а заплатил другое.
 *
 * Идентификаторов цен здесь нет намеренно. Сумму и срок знает только сервер
 * (функция nowpayments-checkout): иначе год покупался бы по цене месяца.
 * Отсюда наружу уходит лишь имя тарифа — `monthly` или `yearly`.
 *
 * Суммы продублированы для показа. Меняете цену — правьте в двух местах:
 * здесь и в секретах функции.
 */

export const PLANS = [
  { id: 'monthly', amount: 20, currency: 'USD', months: 1, days: 31 },
  { id: 'yearly', amount: 199, currency: 'USD', months: 12, days: 365 },
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
