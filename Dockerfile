# ---- 1) Build the React app ----
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2) Build the API ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src
COPY backend/Superette.Api/Superette.Api.csproj backend/Superette.Api/
RUN dotnet restore backend/Superette.Api
COPY backend/ backend/
RUN dotnet publish backend/Superette.Api -c Release -o /out --no-restore

# ---- 3) Final image: one container serves API + website ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=api /out .
COPY --from=web /web/dist ./wwwroot
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Superette.Api.dll"]
