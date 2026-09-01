/**
 * Язык сайта.
 *
 * Берётся из браузера: человеку, у которого система на испанском, не нужно
 * искать переключатель — страница уже открылась так, как ему удобно. Выбранный
 * руками язык запоминается и с этого момента главнее браузерного: раз человек
 * переключил, значит браузер угадал неверно, и переспрашивать его на каждой
 * странице было бы невежливо.
 *
 * Тексты лежат по файлу на язык в lang/ и **подгружаются по одному**. Одиннадцать
 * словарей в одном файле — это около 120 КБ, которые качал бы каждый посетитель
 * ради одного нужного ему языка.
 *
 * Разметка помечает места, куда подставить строки:
 *
 *   data-i18n="ключ"                  — заменить текст элемента
 *   data-i18n-html="ключ"             — то же, но строка со ссылками и <b>
 *   data-i18n-attr="placeholder:ключ" — заменить атрибут (можно несколько
 *                                       через запятую)
 *   data-i18n-doc="terms"             — ссылка на правовой документ: у него
 *                                       свой файл на каждый язык
 *   data-lang                         — сюда встанет переключатель
 *
 * Правовые документы переводом в словаре не занимаются: это отдельные файлы
 * (terms.html, terms-uk.html, terms-en.html), потому что договор должен
 * читаться и без работающего JavaScript, и поисковиком, и платёжным сервисом.
 * Переведены они не на все языки — см. DOC_LANGS.
 */

/** Языки в том порядке, в каком они стоят в переключателе. */
export const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'ru', name: 'Русский' },
  { id: 'uk', name: 'Українська' },
  { id: 'de', name: 'Deutsch' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'it', name: 'Italiano' },
  { id: 'nl', name: 'Nederlands' },
  { id: 'pl', name: 'Polski' },
  { id: 'pt', name: 'Português' },
  { id: 'tr', name: 'Türkçe' },
];

/**
 * Языки, на которые переведены правовые документы.
 *
 * Их меньше, чем языков интерфейса, и намеренно: договор, переведённый машинно
 * и не вычитанный никем из команды, — это обязательство, за которое некому
 * отвечать. Остальным языкам показывается английская версия.
 */
export const DOC_LANGS = ['ru', 'uk', 'en'];

/**
 * Документы, у которых версия одна — английская.
 *
 * Политику конфиденциальности держали на трёх языках, и три текста об одном и
 * том же расходились молча: правка в одном файле не заставляет вспомнить про
 * два других, а противоречие между версиями одного документа — это уже не
 * опечатка, а обязательство, которое нельзя исполнить. Осталась одна редакция,
 * на неё же ссылается карточка расширения в Chrome Web Store.
 *
 * Договор и возвраты остаются переведёнными: их читают перед покупкой.
 */
const EN_ONLY = new Set(['privacy']);

/** Язык, на котором говорим с тем, чей браузер настроен на что-то ещё. */
const FALLBACK = 'en';

/**
 * Версия словарей — метка в адресе файла.
 *
 * Имена файлов не меняются, а содержимое правится часто, и браузер держит их
 * в кеше до десяти минут: после правки человек ещё четверть часа читал бы
 * старые строки и решил бы, что изменения не доехали. **Поправили что-то в
 * lang/ — увеличьте число.**
 */
const DICT_VERSION = 8;

const KEY = 'site_lang';

const known = (id) => LANGS.some((l) => l.id === id);

// localStorage бросает исключение в приватном режиме некоторых браузеров.
// Язык — не та вещь, из-за которой страница имеет право не открыться.
const readChoice = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

const writeChoice = (id) => {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* не сохранилось — переживём, на этой странице язык уже правильный */
  }
};

/**
 * Какой язык показывать.
 *
 * Сначала выбранный руками, потом браузерный. `navigator.languages` — это весь
 * список предпочтений человека, а не только первый: у того, у кого стоит
 * «датский, немецкий, английский», мы возьмём немецкий, а не уйдём сразу в
 * английский, потому что датского у нас нет.
 */
export function pickLang() {
  const chosen = readChoice();
  if (known(chosen)) return chosen;

  const wanted = navigator.languages?.length ? navigator.languages : [navigator.language || ''];
  for (const tag of wanted) {
    const id = String(tag).slice(0, 2).toLowerCase();
    if (known(id)) return id;
  }
  return FALLBACK;
}

let current = pickLang();

/** Загруженные словари: язык страницы и английский про запас. */
const dicts = new Map();

async function load(id) {
  if (dicts.has(id)) return dicts.get(id);
  try {
    const mod = await import(`./lang/${id}.js?v=${DICT_VERSION}`);
    dicts.set(id, mod.default);
  } catch {
    // Файл не доехал до сайта или сеть подвела. Пустой словарь честнее
    // исключения: сработает запасной английский, а страница откроется.
    console.error('словарь не загрузился:', id);
    dicts.set(id, {});
  }
  return dicts.get(id);
}

/** Готовит словарь текущего языка и английский, если он не тот же. */
async function ready() {
  await load(current);
  if (current !== FALLBACK) await load(FALLBACK);
}

/** Текущий язык — для кода, которому нужно знать его самому. */
export const lang = () => current;

/**
 * Строка по ключу. `{имя}` в строке подставляется из `vars`.
 *
 * Пропуск в переводе не должен оставлять пустое место на странице: строки нет —
 * берём английскую, её нет — ключ виден в разметке, и пропажу сразу заметно.
 */
export function t(key, vars) {
  let s = dicts.get(current)?.[key] ?? dicts.get(FALLBACK)?.[key];
  if (s == null) return key;
  if (vars) for (const [name, value] of Object.entries(vars)) s = s.split(`{${name}}`).join(value);
  return s;
}

/**
 * Адрес правового документа. Русский лежит без суффикса; язык, на который
 * договор не переведён, ведёт на английскую версию.
 */
const docLang = (name) =>
  !EN_ONLY.has(name) && DOC_LANGS.includes(current) ? current : FALLBACK;

export function docUrl(name) {
  const id = docLang(name);
  return id === 'ru' ? `/${name}.html` : `/${name}-${id}.html`;
}

/**
 * Правовая страница — по метке `data-doc` на `<html>`.
 *
 * Раньше признаком служили ссылки на переводы, и это сломалось на политике
 * конфиденциальности: у неё редакция одна, переводов нет, ссылаться не на что —
 * и страница переставала считаться правовой. Метка ставится в самом файле и от
 * числа переводов не зависит.
 */
const isDocPage = () => document.documentElement.hasAttribute('data-doc');

const onApply = [];

/** Перерисовать то, что страница строит сама: цены, подписи кнопок, даты. */
export const whenLangChanges = (fn) => onApply.push(fn);

function apply() {
  // На правовой странице `lang` обязан описывать сам документ, а не выбранный
  // язык интерфейса: испанцу мы показываем английский договор, и `lang="es"`
  // на английском тексте — прямая ложь читалке и поисковику. Кнопки в шапке
  // при этом остаются испанскими, и это правильно.
  // На правовой странице `lang` не трогаем: файл объявил его сам, и объявил
  // верно — терминал `terms-uk.html` знает, что он украинский, а
  // `privacy-en.html` знает, что английский. Выбранный язык интерфейса тут
  // подставлять нельзя: политика одна, английская, и `lang="ru"` над её
  // текстом — прямая ложь читалке и поисковику.
  if (!isDocPage()) document.documentElement.lang = current;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }

  // innerHTML здесь безопасен: строки свои, из lang/, снаружи в них ничего
  // не попадает.
  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    el.innerHTML = t(el.dataset.i18nHtml);
  }

  for (const el of document.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  }

  for (const el of document.querySelectorAll('[data-i18n-doc]')) {
    el.href = docUrl(el.dataset.i18nDoc);
  }

  for (const select of document.querySelectorAll('select.lang')) {
    select.value = current;
    select.setAttribute('aria-label', t('common.langLabel'));
  }

  for (const fn of onApply) fn(current);
}

/**
 * Ссылка на этот же документ на другом языке.
 *
 * Нет перевода — отдаём английский: у правовых страниц языков меньше, чем у
 * интерфейса, и уводить испанца в никуда нельзя.
 */
const altFor = (id) =>
  document.querySelector(`link[rel="alternate"][hreflang="${id}"]`) ??
  document.querySelector(`link[rel="alternate"][hreflang="${FALLBACK}"]`);

/**
 * Сменить язык.
 *
 * На правовых страницах перекрашивать нечего — там текст лежит в отдельном
 * файле, и переключатель просто уводит на него.
 */
export async function setLang(id) {
  if (!known(id) || id === current) return;
  writeChoice(id);

  const alt = altFor(id);
  if (alt) {
    location.href = alt.href;
    return;
  }

  current = id;
  await ready();
  apply();
}

/**
 * Правовая страница на чужом языке → уходим на её перевод.
 *
 * `replace`, а не переход: иначе кнопка «назад» возвращала бы на страницу,
 * которая тут же снова себя заменяет, и выйти назад было бы невозможно.
 */
function redirectDocPage() {
  const alt = altFor(current);
  if (!alt) return false;

  const there = new URL(alt.href, location.href);
  if (there.pathname === location.pathname) return false;

  location.replace(there.href);
  return true;
}

/** Переключатель — там, где размечено `data-lang`. */
function mountSwitch() {
  for (const host of document.querySelectorAll('[data-lang]')) {
    const select = document.createElement('select');
    select.className = 'lang';

    for (const { id, name } of LANGS) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.append(option);
    }

    select.addEventListener('change', () => setLang(select.value));
    host.replaceChildren(select);
  }
}

/**
 * Запуск. Ждать обязательно: словарь приходит по сети, и код страницы,
 * позвавший `t()` раньше времени, получил бы вместо строк голые ключи.
 */
export async function initI18n() {
  if (redirectDocPage()) return;
  await ready();
  mountSwitch();
  apply();
}
