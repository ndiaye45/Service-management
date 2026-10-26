# Service Management

Application de mise en relation entre des personnes qui cherchent un service et des prestataires qui le proposent.

```
Service-Management/
├─ .github/workflows/ci.yml        build backend + frontend
├─ service-management-backend/     Spring Boot 4, Java, JWT, PostgreSQL  (+ Dockerfile)
├─ service-management-frontend/    Angular 21, Tailwind CSS              (+ Dockerfile)
├─ docker-compose.yml              db + backend + frontend
├─ .env.example                    variables d'environnement (copier en .env)
└─ README.md
```

## Lancer avec Docker

```bash
cp .env.example .env      # puis renseigner POSTGRES_PASSWORD et JWT_SECRET
docker compose up --build
```

| Service | URL |
|---|---|
| Application (frontend) | http://localhost:8080 |
| API directe (backend) | http://localhost:8081/api |
| PostgreSQL | localhost:5435 |

Le frontend (nginx) relaie `/api` vers le backend : une seule origine, aucun CORS à configurer.

## Développement sans Docker

- **Backend** : démarrer PostgreSQL (`docker compose up db`), puis lancer l'application depuis l'IDE. Elle utilise `application.properties` (port 8080).
- **Frontend** : `cd service-management-frontend && npm install --legacy-peer-deps && npm start` (http://localhost:4200, `/api` relayé vers `localhost:8080` par `proxy.conf.json`).

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | base de données |
| `JWT_SECRET` | clé de signature, **Base64** (`openssl rand -base64 48`) |
| `JWT_EXPIRATION` | validité du token en ms |
| `FRONTEND_PORT`, `BACKEND_PORT`, `DB_PORT` | ports exposés |
