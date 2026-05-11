# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore — copy only csproj first to maximise layer caching.
# We stub the .esproj so dotnet restore doesn't need Node or the client source.
COPY NutriMate.Server/NutriMate.Server.csproj NutriMate.Server/
RUN mkdir -p nutrimate.client && \
    printf '<Project Sdk="Microsoft.VisualStudio.JavaScript.Sdk">\
      <PropertyGroup><StartupCommand>echo noop</StartupCommand></PropertyGroup>\
    </Project>' > nutrimate.client/nutrimate.client.esproj
RUN dotnet restore NutriMate.Server/NutriMate.Server.csproj -p:BuildSpaProject=false

# Build & publish — skip SPA build entirely
COPY NutriMate.Server/ NutriMate.Server/
RUN dotnet publish NutriMate.Server/NutriMate.Server.csproj \
        -c Release \
        -o /app/publish \
        --no-restore \
        -p:UseAppHost=false \
        -p:BuildSpaProject=false

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "NutriMate.Server.dll"]
