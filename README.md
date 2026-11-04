# gather

A full-stack, real-time messaging app built with React, Django REST Framework,
Django Channels, and JWT authentication.

## Features

- Account creation and sign-in with access-token refresh
- Search for people and start one-to-one conversations
- Conversation history persisted in the database
- Live message delivery over authenticated WebSockets, with REST fallback
- Responsive inbox and chat interface
- Django admin for users, conversations, and messages

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend runs at `http://127.0.0.1:8000`. SQLite and an in-memory Channels
layer are used by default, so no database or Redis service is needed to get
started.

Optional environment settings:

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Secret key; set a unique value outside local development |
| `DJANGO_DEBUG` | Django debug mode; defaults to `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed host names |
| `DB_ENGINE` | Set to `postgresql` to use PostgreSQL |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL connection settings |
| `REDIS_URL` | Redis URL for a shared Channels layer; omit for in-memory development |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). The
frontend talks to the backend at `http://127.0.0.1:8000` by default. Set
`VITE_API_URL` to override the API base URL. WebSockets use the current site
host, so the development proxy forwards them to the backend.

## Tests and checks

```bash
cd backend
python manage.py test
python manage.py makemigrations --check --dry-run
```

```bash
cd frontend
npm run lint
npm run build
```

## API overview

- `POST /api/accounts/register/` — create an account
- `POST /api/accounts/token/` and `POST /api/accounts/token/refresh/` — JWT auth
- `GET /api/accounts/me/` — current profile
- `GET /api/accounts/users/?search=...` — search people
- `GET, POST /api/conversations/` — list chats or open/create a direct chat
- `GET, POST /api/chat/<conversation_id>/messages/` — chat history and REST send
- `ws://<host>/ws/chat/<conversation_id>/?token=<access-token>` — live messages

WebSocket clients send `{"type":"message","content":"Hello"}`. The server
validates membership, persists the message, and broadcasts it to the conversation.
# chat-app
