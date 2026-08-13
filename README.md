# Recs Assistant — страницы сайта

Две страницы, которые должны быть доступны по адресу в интернете. Расширение сюда
не входит и входить не должно: этот репозиторий публичный, а в исходниках расширения
есть ключ к модели.

| Файл | Когда открывается |
|---|---|
| `confirmed.html` | после перехода по ссылке из письма о подтверждении почты |
| `account.html` | оплата подписки и управление ею |

## Публикация

GitHub → Settings → Pages → Source: **Deploy from a branch** → ветка `main`, папка `/ (root)`.

Через минуту страницы открываются по адресам:

- `https://<логин>.github.io/recs-assistant/confirmed.html`
- `https://<логин>.github.io/recs-assistant/account.html`

## Что вписать после публикации

| Где | Что |
|---|---|
| `SITE_URL` в `src/subscription.js` расширения | адрес без имени файла |
| Supabase → Authentication → URL Configuration → Site URL | адрес `confirmed.html` |
| Paddle → Checkout → Default payment link | адрес `account.html` |
| `CONFIG` в `account.html` | client-side token Paddle (`live_…`) и id цены (`pri_…`) |

## Про секреты

В `account.html` лежат адрес Supabase, его publishable key и client-side token Paddle.
Все три предназначены для браузера и публичны по своей природе — репозиторий можно
делать открытым.

Чего здесь быть не должно никогда: серверный ключ Paddle (`pdl_live_apikey_…`),
service role key Supabase, ключ к модели. Их место — секреты Supabase.
