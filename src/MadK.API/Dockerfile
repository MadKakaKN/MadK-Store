# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY MadK.sln .
COPY src/MadK.Domain/MadK.Domain.csproj src/MadK.Domain/
COPY src/MadK.Application/MadK.Application.csproj src/MadK.Application/
COPY src/MadK.Infrastructure/MadK.Infrastructure.csproj src/MadK.Infrastructure/
COPY src/MadK.API/MadK.API.csproj src/MadK.API/

# Restore only (cached if .csproj files haven't changed)
RUN dotnet restore src/MadK.API/MadK.API.csproj

# Copy all source code
COPY src/ src/

# Build and publish
RUN dotnet publish src/MadK.API/MadK.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=build /app/publish .

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "MadK.API.dll"]
