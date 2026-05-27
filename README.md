# SolarPro — B2B Platform

> Digital platform for solar sector transformation.

**SolarPro** is a comprehensive B2B web platform designed for solar panel installation companies. It automates energy analysis through OCR, calculates optimal photovoltaic systems using geographic data, and generates professional technical proposals ready for clients.

---

## Tech Stack

| Layer | Technology |
|------|------------|
| **Frontend** | React (Vite) + TypeScript |
| **Backend** | NestJS + TypeScript |
| **Database** | PostgreSQL |
| **Cache** | Redis |
| **Infrastructure** | Docker & Docker Compose |

---

## Getting Started

Follow these steps to set up the project on your local machine.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) **v18+** (includes npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Installation Steps

#### 1️⃣ Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd solarpro-b2b
```

#### 2️⃣ Start infrastructure (PostgreSQL & Redis)

```bash
docker-compose up -d
```

> 💡 Use `docker-compose down` to stop the containers.

#### 3️⃣ Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

**Available at:** `http://localhost:3000`

#### 4️⃣ Frontend (React + Vite)

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

**Available at:** `http://localhost:5173`

---

## Git Workflow & Branching Strategy

To keep the code clean and avoid conflicts, we follow this workflow strictly.

⚠️ **Prohibited:** Direct push to `main` or `develop`

### Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|----------|
| `feature/` | New functionality | `feature/ocr-adapter` |
| `bugfix/` | Bug fixes | `bugfix/login-error` |
| `hotfix/` | Production hotfix | `hotfix/critical-issue` |
| `docs/` | Documentation | `docs/api-reference` |

### Daily Workflow

**1. Get the latest changes:**

```bash
git checkout develop
git pull origin develop
```

**2. Create your working branch:**

```bash
git checkout -b feature/your-feature-name
```

**3. Write code with Conventional Commits:**

```bash
git add .
git commit -m "feat: add OCR processing use case"
git commit -m "fix: resolve database connection timeout"
git commit -m "ui: create dashboard layout"
```

> Learn more about [Conventional Commits](https://www.conventionalcommits.org/)

**4. Push your branch:**

```bash
git push origin feature/your-feature-name
```

**5. Open a Pull Request (PR):**

- Go to GitHub and open a PR pointing to `develop`
- Requires **≥ 1 approval** before merge

---

## Architecture (Clean Architecture)

This project strictly follows **Clean Architecture** principles. When working on the backend, always respect the *dependency rule*: **inner layers cannot depend on outer layers**.

> **Full design documentation lives in [docs/](docs/README.md)** — start with [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), then [docs/CLEAN_ARCHITECTURE.md](docs/CLEAN_ARCHITECTURE.md), then the per-service plans in [docs/plans/](docs/plans/).

```
┌─────────────────────────────────────┐
│    Domain Layer                     │
│    └─ Entities & Business Logic     │
│       (No external frameworks)      │
└─────────────────────────────────────┘
            ▲
            │
┌─────────────────────────────────────┐
│    Application Layer                │
│    └─ Use Cases (Interactors)       │
│       (Data orchestration)          │
└─────────────────────────────────────┘
            ▲
            │
┌─────────────────────────────────────┐
│    Infrastructure Layer             │
│    └─ NestJS Controllers            │
│    └─ TypeORM Repositories          │
│    └─ External Service Adapters     │
└─────────────────────────────────────┘
```

---

## Team — KISS Team

| Nombre |
|--------|
| Cauich Pasos Omar Jesús |
| Chan Puc Angel Adrian |
| Flores Juárez Víctor |
| Gonzalez Lugo Angel Alberto |
| Martin Valdez Dione Guadalupe |
| Mendez Sierra Daniel |