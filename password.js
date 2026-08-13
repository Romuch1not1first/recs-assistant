/**
 * Надёжность пароля при регистрации.
 *
 * Считаем сами, потому что Supabase проверяет только длину — шесть символов.
 * Для аккаунта, к которому привязана оплата, этого мало: подбор по словарю
 * ломает такой пароль за минуты.
 *
 * Проверка живёт в popup, а не на сервере, и потому она — подсказка, а не
 * защита: кто захочет, зарегистрируется через API с любым паролем. Смысл в
 * другом — не дать обычному человеку по невнимательности поставить `123456`
 * на аккаунт с подпиской.
 */

/** Короче — не пропускаем вовсе, сколько бы разных символов там ни было. */
export const MIN_LENGTH = 8;

/** Уровень, ниже которого регистрация не идёт. 0 — никуда не годится, 4 — надёжный. */
export const MIN_LEVEL = 2;

/**
 * Пароли, которые подбирают первыми.
 *
 * Список намеренно короткий: полный словарь занял бы мегабайты и всё равно не
 * был бы полным. Эти ловят самый частый случай — когда пароль набирают не
 * думая. Сравнение идёт в нижнем регистре, `Password1` тоже сюда попадает.
 */
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123',
  'qwertyui', 'qwerty123', 'iloveyou', 'admin123', 'welcome1', 'abc12345',
  'letmein1', 'monkey12', 'football', 'baseball', 'superman', 'trustno1',
  'passw0rd', 'zaq12wsx', 'qazwsxedc', '11111111', '00000000', 'asdfghjk',
  'йцукенгш', 'ячсмитьб', 'parol123', 'пароль123',
]);

/** Классы символов: чем их больше, тем шире перебор у того, кто подбирает. */
const CLASSES = [/[a-zа-яё]/u, /[A-ZА-ЯЁ]/u, /\d/, /[^\p{L}\d]/u];

/**
 * Оценка пароля.
 *
 * @param {string} password
 * @returns {{level:number, ok:boolean, issue:?string, classes:number}}
 *   `issue` — код для словаря: что именно мешает (`short`, `common`, `plain`).
 */
export function scorePassword(password) {
  const value = String(password ?? '');
  if (!value) return { level: 0, ok: false, issue: null, classes: 0 };

  const classes = CLASSES.filter((re) => re.test(value)).length;

  if (value.length < MIN_LENGTH) return { level: 0, ok: false, issue: 'short', classes };
  if (COMMON.has(value.toLowerCase())) return { level: 0, ok: false, issue: 'common', classes };

  // Длина важнее разнообразия: восемь случайных строчных букв перебираются
  // дольше, чем «Abc123!» с четырьмя классами. Поэтому за длину два очка.
  let level = 1;
  if (value.length >= 12) level++;
  if (value.length >= 16) level++;
  if (classes >= 2) level++;
  if (classes >= 3) level++;
  level = Math.min(level, 4);

  // Одни только строчные буквы или одни цифры — самый быстрый перебор,
  // сколько бы их ни было. Такой пароль до проходного уровня не дотягиваем.
  if (classes < 2) return { level: Math.min(level, 1), ok: false, issue: 'plain', classes };

  return { level, ok: level >= MIN_LEVEL, issue: null, classes };
}
