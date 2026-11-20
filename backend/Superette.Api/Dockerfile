# Backend-only image for Render (the website is hosted on Vercel)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/Superette.Api/Superette.Api.csproj backend/Superette.Api/
RUN dotnet restore backend/Superette.Api
COPY backend/ backend/
RUN dotnet publish backend/Superette.Api -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
USER $APP_UID
EXPOSE 10000
# Render tells the app which port to use through $PORT
CMD ["sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-10000} exec dotnet Superette.Api.dll"]