# Script para iniciar el entorno local de Docker y mostrar las URLs de acceso

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando entorno local de Alkilo   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica si existe el archivo docker-compose.yml
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "Error: No se encontró el archivo docker-compose.yml" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Ejecuta docker-compose
Write-Host "Iniciando contenedores..." -ForegroundColor Green
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Contenedores iniciados exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  URLs de acceso disponibles" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "API REST:" -ForegroundColor Magenta
    Write-Host "   http://localhost:3000" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Swagger (Documentación API):" -ForegroundColor Magenta
    Write-Host "   http://localhost:3000/api/docs" -ForegroundColor White
    Write-Host ""
    
   
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Conectar a la base de datos" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usando psql:" -ForegroundColor Yellow
    Write-Host "   docker exec -it alkilo-postgres psql -U postgres -d alkilo_db" -ForegroundColor White
    Write-Host ""
    Write-Host "Usando herramientas como DBeaver, pgAdmin, etc:" -ForegroundColor Yellow
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Port: 5432" -ForegroundColor White
    Write-Host "   Database: alkilo_db" -ForegroundColor White
    Write-Host "   Username: postgres" -ForegroundColor White
    Write-Host "   Password: postgres" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Error al iniciar los contenedores" -ForegroundColor Red
    Write-Host "Revisa los logs para más detalles:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs" -ForegroundColor White
    Write-Host ""
}
