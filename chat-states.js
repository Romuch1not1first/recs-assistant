/**
 * В каком состоянии переписка.
 *
 * Один и тот же расчёт нужен в двух местах: расширение по нему решает, что
 * отправить на сервер, а дашборд на сайте — в какую колонку положить карточку.
 * Разъехаться им нельзя: тогда «ждёт ответа» в расширении и «ждёт ответа» на
 * сайте окажутся разными вещами, и объяснить это человеку будет нечем.
 *
 * Поэтому модуль чистый и общий: ни chrome, ни сети, ни DOM. В сайт он
 * копируется сборкой (см. scripts/sync-site.mjs) — ровно тем же приёмом, что и
 * правило надёжности пароля.
 */

/** Сутки в миллисекундах: дальше всё считается в них. */
const DAY = 24 * 60 * 60 * 1000;

/**
 * Границы, по которым переписка меняет состояние.
 *
 * Трое суток — когда молчание перестаёт быть «занята» и становится сигналом.
 * Две недели — когда возвращаться уже не к чему: за это время человек успевает
 * познакомиться, сходить на свидание и забыть, как вас зовут.
 */
export const QUIET_DAYS = 3;
export const DEAD_DAYS = 14;

/**
 * Колонки дашборда. Порядок тот же, в каком они стоят на странице.
 *
 * `yours` первой не случайно: остальные четыре рассказывают, что уже случилось,
 * и сделать с этим нечего, а эта — единственная, где ход ваш.
 */
export const COLUMNS = ['yours', 'waiting', 'unmatched', 'reengage', 'dead'];

/**
 * Куда попадает эта переписка.
 *
 * `yours` — последнее слово за ней, ход его. Самое горячее из пяти состояний:
 * там, где ответа ждут от вас, всё ещё можно всё исправить.
 *
 * @param {{status?: string, lastMine?: boolean, lastAt?: number}} chat
 * @param {number} [now] «сейчас» — параметром, чтобы проверку можно было повторить
 * @returns {'unmatched'|'yours'|'waiting'|'reengage'|'dead'|null}
 */
export function columnOf(chat, now = Date.now()) {
  if (!chat) return null;
  if (chat.status === 'unmatched') return 'unmatched';

  // Времени нет — судить не по чему. Такое бывает у переписки, которую ни разу
  // не открывали: список матчей отдаёт последнее сообщение не всегда.
  const at = lastAt(chat);
  if (!at) return null;

  // Последнее слово за ней — ход его, и никакого ожидания тут нет.
  if (!(chat.lastMine ?? chat.last_mine)) return 'yours';

  const days = (now - at) / DAY;

  if (days < QUIET_DAYS) return 'waiting';
  return days <= DEAD_DAYS ? 'reengage' : 'dead';
}

/**
 * Раскладывает список по колонкам.
 *
 * Внутри колонки — свежие сверху: в «ждёт ответа» это порядок нетерпения, в
 * «пора вернуться» — порядок надежды.
 */
export function board(chats, now = Date.now()) {
  const out = { waiting: [], unmatched: [], reengage: [], dead: [], yours: [] };

  for (const chat of chats ?? []) {
    const where = columnOf(chat, now);
    if (where) out[where].push(chat);
  }

  for (const list of Object.values(out)) {
    list.sort((a, b) => lastAt(b) - lastAt(a));
  }

  return out;
}

/**
 * Время последнего сообщения — как бы поле ни называлось.
 *
 * Модуль общий, а имена по дороге меняются: в расширении это `lastAt` числом,
 * из базы приходит `last_at` строкой ISO. Разбирать это в двух местах по-своему
 * значит однажды получить пустую доску и полдня искать почему — что и случилось
 * при первой же сборке страницы.
 */
function lastAt(chat) {
  const raw = chat?.lastAt ?? chat?.last_at;
  const at = typeof raw === 'string' ? Date.parse(raw) : Number(raw);

  return Number.isFinite(at) && at > 0 ? at : 0;
}

/** Сколько дней молчит переписка. Для подписи на карточке. */
export function silentDays(chat, now = Date.now()) {
  const at = lastAt(chat);
  return at ? Math.max(0, Math.floor((now - at) / DAY)) : null;
}

/**
 * Теги, которыми классификатор объясняет анмэтч.
 *
 * Список закрытый и общий для сервера и сайта: свободный текст в этом месте
 * означал бы, что на дашборде появится сто разных формулировок одного и того
 * же, и посчитать их станет нельзя.
 */
export const ERROR_TAGS = [
  'too_needy',
  'boring_interview',
  'creepy',
  'logical_fail',
  'no_mistake',
];

/** Тег из чужого ответа — или `null`, если это не наш тег. */
export const errorTag = (v) => (ERROR_TAGS.includes(String(v ?? '')) ? String(v) : null);
