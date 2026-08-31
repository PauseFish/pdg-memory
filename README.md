# PDG Memory

Memory-kaartjesspel met een backend en een beveiligd beheerdashboard om kaartjes
(vragen en YouTube-video's) toe te voegen en te verwijderen.

## Installeren

```bash
npm install
cp .env.example .env
```

Genereer een wachtwoord-hash voor het admin-account en zet die in `.env`:

```bash
npm run hash-password -- "jouwWachtwoord"
```

Vul in `.env` in:
- `ADMIN_USERNAME` — de gebruikersnaam waarmee je inlogt
- `ADMIN_PASSWORD_HASH` — de hash die het commando hierboven print
- `SESSION_SECRET` — een lange, willekeurige string

## Starten

```bash
npm start
```

- Spel: http://localhost:3000
- Beheerdashboard (inloggen + items toevoegen/verwijderen): http://localhost:3000/dashboard.html
  (of via het tandwiel-icoontje rechtsonder in het spel)

## Hoe het werkt

- De kaartjes staan in `data/items.json` (wordt bij eerste start aangemaakt vanuit
  `data/seed.json`) en niet meer hardcoded in JS.
- Het spel haalt de kaartjes op via `GET /api/cards`.
- Het dashboard logt in via `POST /api/login` (sessie-cookie) en beheert kaartjes via
  `GET/POST /api/admin/cards` en `DELETE /api/admin/cards/:id`, allemaal achter een
  login-check.
- Er is één vast admin-account (uit `.env`); geen gebruikersregistratie.
