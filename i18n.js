/**
 * Язык сайта.
 *
 * Берётся из браузера: человеку, у которого система на украинском, не нужно
 * искать переключатель — страница уже открылась так, как ему удобно. Выбранный
 * руками язык запоминается и с этого момента главнее браузерного: раз человек
 * переключил, значит браузер угадал неверно, и переспрашивать его на каждой
 * странице было бы невежливо.
 *
 * Тексты лежат в strings.js — общем файле на все страницы. Разметка помечает
 * места, куда их подставить:
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
 * Такие страницы связаны между собой через <link rel="alternate" hreflang>, и
 * переключатель на них не перекрашивает текст, а уводит на нужный файл.
 */

import { STRINGS } from './strings.js';

/** Языки в том порядке, в каком они стоят в переключателе. */
export const LANGS = [
  { id: 'ru', name: 'Русский' },
  { id: 'uk', name: 'Українська' },
  { id: 'en', name: 'English' },
];

/** Язык, на котором говорим с тем, чей браузер настроен на что-то ещё. */
const FALLBACK = 'en';

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
 * «польский, украинский, русский», мы возьмём украинский, а не уйдём в
 * запасной английский, потому что польского у нас нет.
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

/** Текущий язык — для кода, которому нужно знать его самому. */
export const lang = () => current;

/**
 * Строка по ключу. `{имя}` в строке подставляется из `vars`.
 *
 * Пропуск в переводе не должен оставлять пустое место на странице: строки нет —
 * берём английскую, её нет — ключ виден в разметке, и пропажу сразу заметно.
 */
export function t(key, vars) {
  let s = STRINGS[current]?.[key] ?? STRINGS[FALLBACK]?.[key];
  if (s == null) return key;
  if (vars) for (const [name, value] of Object.entries(vars)) s = s.split(`{${name}}`).join(value);
  return s;
}

/** Адрес правового документа на текущем языке. Русский лежит без суффикса. */
export const docUrl = (name) => (current === 'ru' ? `/${name}.html` : `/${name}-${current}.html`);

const onApply = [];

/** Перерисовать то, что страница строит сама: цены, подписи кнопок, даты. */
export const whenLangChanges = (fn) => onApply.push(fn);

function apply() {
  document.documentElement.lang = current;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }

  // innerHTML здесь безопасен: строки свои, из strings.js, снаружи в них
  // ничего не попадает.
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
 * Сменить язык.
 *
 * На правовых страницах перекрашивать нечего — там текст лежит в отдельном
 * файле, и переключатель просто уводит на него.
 */
export function setLang(id) {
  if (!known(id) || id === current) return;
  writeChoice(id);

  const alt = document.querySelector(`link[rel="alternate"][hreflang="${id}"]`);
  if (alt) {
    location.href = alt.href;
    return;
  }

  current = id;
  apply();
}

/**
 * Правовая страница на чужом языке → уходим на её перевод.
 *
 * `replace`, а не переход: иначе кнопка «назад» возвращала бы на страницу,
 * которая тут же снова себя заменяет, и выйти назад было бы невозможно.
 */
function redirectDocPage() {
  const alt = document.querySelector(`link[rel="alternate"][hreflang="${current}"]`);
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

/** Запуск: вызывается страницей после того, как она подписалась на смену языка. */
export function initI18n() {
  if (redirectDocPage()) return;
  mountSwitch();
  apply();
}
