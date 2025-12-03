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
    
    Write-Host "Base de datos PostgreSQL:" -ForegroundColor Magenta
    Write-Host "   Host: localhost" -ForegroundColor White
    Write-Host "   Puerto: 5432" -ForegroundColor White
    Write-Host "   Usuario: postgres" -ForegroundColor White
    Write-Host "   Password: postgres" -ForegroundColor White
    Write-Host "   Base de datos: alkilo_db" -ForegroundColor White
    Write-Host ""
    
    Write-Host "MinIO (Almacenamiento de objetos):" -ForegroundColor Magenta
    Write-Host "   API: http://localhost:9000" -ForegroundColor White
    Write-Host "   Console: http://localhost:9001" -ForegroundColor White
    Write-Host "   Usuario: minioadmin" -ForegroundColor White
    Write-Host "   Password: minioadmin123" -ForegroundColor White
    Write-Host "   Bucket: alkilo-uploads" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Datos sembrados automáticamente" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✓ 16 provincias con 168 municipios" -ForegroundColor Green
    Write-Host "✓ 50 usuarios de prueba" -ForegroundColor Green
    Write-Host "✓ 36 casas distribuidas por Cuba" -ForegroundColor Green
    Write-Host "✓ 35 reseñas de usuarios" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usuario de prueba:" -ForegroundColor Yellow
    Write-Host "   Email: carlos.garcia@example.com" -ForegroundColor White
    Write-Host "   Password: Abc123456" -ForegroundColor White
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Comandos útiles" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ver logs del backend:" -ForegroundColor Yellow
    Write-Host "   docker logs alkilo-backend -f" -ForegroundColor White
    Write-Host ""
    Write-Host "Ver logs de todos los servicios:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor White
    Write-Host ""
    Write-Host "Ver estado de contenedores:" -ForegroundColor Yellow
    Write-Host "   docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "Detener contenedores:" -ForegroundColor Yellow
    Write-Host "   docker-compose down" -ForegroundColor White
    Write-Host ""
    Write-Host "Detener y eliminar volúmenes:" -ForegroundColor Yellow
    Write-Host "   docker-compose down -v" -ForegroundColor White
    Write-Host ""
    Write-Host "Reconstruir y reiniciar backend:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d --build backend" -ForegroundColor White
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
