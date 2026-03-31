# TaskPilot (Project & Task Management)

Full-stack Project and Task Management web application.

## Tech stack

- Backend: Django + Django REST Framework
- Auth: JWT (`djangorestframework-simplejwt`) with **role in token**
- DB: PostgreSQL (with SQLite fallback if env not set)
- Frontend: React + Bootstrap (Vite)
- Chatbot: Rule-based (Django API) + chat history + PDF export (reportlab)

## Folder structure

- `backend/`: Django project
- `frontend/`: React app

## Quickstart (local)

### 1) Database (PostgreSQL)

Option A: run Postgres with Docker:

```bash
docker compose up -d
```

Option B: use your local Postgres installation and create a DB/user.

### 2) Backend (Django)

1. Copy env file:

```bash
cd backend
copy .env.example .env
```

2. Install deps and run migrations:

```bash
cd backend
py -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py seed
.\.venv\Scripts\python manage.py runserver
```

Backend runs at `http://localhost:8000/`.

### 3) Frontend (React)

Install Node.js (LTS), then:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173/`.

## Sample accounts (created by seed)

- **admin / admin12345** (ADMIN)
- **manager / manager12345** (MANAGER)
- **intern / intern12345** (INTERN)

## API endpoints (high level)

- **Auth**
  - `POST /api/auth/register/`
  - `POST /api/auth/login/` (JWT includes `role`)
  - `POST /api/auth/refresh/`
  - `GET /api/auth/me/`
  - `GET/POST/PATCH/DELETE /api/auth/users/` (Admin only)
- **Tasks**
  - `GET/POST /api/tasks/`
  - `GET/PATCH/DELETE /api/tasks/<id>/`
  - `GET /api/tasks/progress/`
  - Query params: `q`, `status`, `deadline_before=YYYY-MM-DD`, `deadline_after=YYYY-MM-DD`, `due_today=1`, `overdue=1`
- **Chatbot**
  - `POST /api/chat/message/`
  - `GET /api/chat/history/`
  - `GET /api/chat/history/pdf/` (downloads PDF)

## RBAC rules (enforced in backend)

- **Admin**: full access (users, all tasks, chatbot)
- **Manager**: create tasks, assign tasks, view team tasks
- **Intern**: can only see assigned tasks and can only update **status**

## Chatbot commands

- `add task <task name>` (Admin/Manager only)
- `show tasks`
- `show pending tasks`
- `tasks due today`
- `help`

