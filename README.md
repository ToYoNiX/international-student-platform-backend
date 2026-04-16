# International Student Platform — Backend

Strapi v5 CMS powering the MUST (Misr University for Science & Technology) International Student Platform. Provides a REST/GraphQL API and a branded admin dashboard for managing all platform content.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Strapi v5.41.1 |
| Runtime | Node.js >=20 |
| Database | SQLite (dev) / PostgreSQL or MySQL (prod) |
| Auth | JWT via `users-permissions` plugin |
| Email | Nodemailer (SMTP) |

---

## Content Types

| Collection | Description |
|------------|-------------|
| `academic-staff` | University staff profiles |
| `chat-conversation` | Chat threads between users |
| `chat-message` | Individual messages within a conversation |
| `event` | Campus events and announcements |
| `hero-slide` | Homepage hero carousel slides |
| `news-item` | News articles |
| `page` | Generic CMS pages |
| `schedule` | Class / academic schedules |
| `study-plan` | Student study plans |

---

## Plugins

- **users-permissions** — JWT authentication with 7-day token expiry. Registration supports custom fields: `displayName`, `universityId`, `bio`, `phoneNumber`, `preferences`.
- **tree-menus** — Hierarchical menu management (title, URL, target, access roles).
- **chat-inbox** — Custom plugin (`src/plugins/chat-inbox`) providing an admin inbox UI for conversations and messaging.
- **email** — Nodemailer provider, configured via environment variables.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 9

### Install dependencies

```bash
npm install
```

### Development (with auto-reload)

```bash
npm run develop
```

### Production start

```bash
npm run start
```

### Build admin panel

```bash
npm run build
```

---

## Environment Variables

Create a `.env` file at the project root. Required variables:

```env
# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=<generated>
API_TOKEN_SALT=<generated>
ADMIN_JWT_SECRET=<generated>
TRANSFER_TOKEN_SALT=<generated>
JWT_SECRET=<generated>

# Database (defaults to SQLite if not set)
DATABASE_CLIENT=sqlite        # or: postgres | mysql
DATABASE_HOST=
DATABASE_PORT=
DATABASE_NAME=
DATABASE_USERNAME=
DATABASE_PASSWORD=

# Email (Nodemailer / SMTP)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# Frontend origin allowed by CORS
FRONTEND_URL=http://localhost:5173
```

---

## Project Structure

```
src/
├── admin/          # Admin dashboard customization (MUST branding)
├── api/            # Content type controllers, routes, services
├── extensions/     # Plugin extensions (users-permissions, tree-menus)
└── plugins/
    └── chat-inbox/ # Custom chat inbox admin plugin
config/
├── database.ts     # Database config (SQLite / Postgres / MySQL)
├── middlewares.ts  # CORS, security, etc.
└── plugins.ts      # Plugin registration and config
public/
└── must_logo.png   # MUST university logo used in admin panel
```

---

## Admin Dashboard

The admin panel is customized to match MUST brand identity:

- **Logo:** MUST university logo
- **Colors:** Navy `#0D1B3E`, Green `#1B8A3D`, Gold `#C5A55A`
- **Font:** Poppins
- **Title:** "International Student Platform — Admin Dashboard"

Access at `http://localhost:1337/admin` after running `npm run develop`.
