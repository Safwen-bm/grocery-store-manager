# Superette Faiza 🛒

Grocery catalog & admin app.

- **Backend:** ASP.NET Core (.NET 10, Minimal APIs) + MongoDB Atlas
- **Frontend:** React 19 + Vite + Tailwind CSS v4 (RTL / Arabic)
- **Auth:** server-side admin accounts, HttpOnly cookie, login rate-limiting

## Structure

```
backend/Superette.Api/   Program.cs, Endpoints/, Models/, Data/
frontend/                React app (src/pages, src/components, src/lib)
Dockerfile               one image = API + built website
.github/workflows/ci.yml build + lint on every push / PR
```

## Local setup

```bash
npm run install:all

# Secrets stay on your machine (not in the repo):
cd backend/Superette.Api
dotnet user-secrets set "Mongo:ConnectionString" "mongodb+srv://USER:PASS@CLUSTER.mongodb.net/?retryWrites=true&w=majority"
dotnet user-secrets set "Admin:Username" "admin"
dotnet user-secrets set "Admin:Password" "a-long-password-min-10-chars"
cd ../..

npm start        # API: http://localhost:5000  |  Web: http://localhost:5173
```

The first admin is created from `Admin:*` only when the `users` collection is empty.

## Security notes

- Public API (`/api/products`) never returns cost price or margin; `/api/admin/*` requires login.
- Selling price is computed on the server.
- Cookie: HttpOnly, SameSite=Strict, Secure in production. Login limited to 5 tries/min/IP.
- CSP + security headers on every response.

## Docker

```bash
docker build -t superette-faiza .
docker run -p 8080:8080 --env-file .env superette-faiza
```

## License

ISC
