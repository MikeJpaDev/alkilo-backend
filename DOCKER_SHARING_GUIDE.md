# Guía para Compartir Imágenes Docker de Alkilo Backend

## Opción 1: Construir y Compartir la Imagen Completa

### 1. Construir la imagen de la aplicación backend
```powershell
docker build -t alkilo-backend:latest .
```

### 2. Exportar todas las imágenes como archivos .tar
```powershell
# Exportar backend
docker save -o alkilo-backend.tar alkilo-backend:latest

# Exportar PostgreSQL (opcional, ya está en Docker Hub)
docker save -o alkilo-postgres.tar postgres:15-alpine

# Exportar MinIO (opcional, ya está en Docker Hub)
docker save -o alkilo-minio.tar minio/minio:latest
```

### 3. Comprimir para reducir tamaño (opcional)
```powershell
# Instalar 7-Zip si no lo tienes
# Comprimir el archivo tar
7z a alkilo-backend.7z alkilo-backend.tar
```

### 4. Cargar la imagen en otro equipo
```powershell
# En el equipo destino, cargar la imagen
docker load -i alkilo-backend.tar
```

---

## Opción 2: Usar Docker Compose (Recomendado)

### 1. Compartir estos archivos
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- Todo el código fuente (package.json, src/, etc.)

### 2. En el equipo destino, ejecutar
```powershell
# Construir y levantar todos los servicios
docker-compose up -d --build

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (datos)
docker-compose down -v
```

---

## Opción 3: Publicar en Docker Hub

### 1. Crear cuenta en Docker Hub (hub.docker.com)

### 2. Hacer login desde terminal
```powershell
docker login
```

### 3. Etiquetar la imagen con tu usuario
```powershell
docker tag alkilo-backend:latest TU_USUARIO/alkilo-backend:latest
```

### 4. Publicar la imagen
```powershell
docker push TU_USUARIO/alkilo-backend:latest
```

### 5. Otros pueden descargarla con
```powershell
docker pull TU_USUARIO/alkilo-backend:latest
```

---

## Opción 4: Exportar Contenedores en Ejecución

### Exportar un contenedor específico (incluye cambios en runtime)
```powershell
# Exportar el contenedor de postgres con datos
docker export alkilo-postgres > alkilo-postgres-container.tar

# Importar como imagen
docker import alkilo-postgres-container.tar alkilo-postgres-with-data:latest
```

**Nota:** Este método exporta el sistema de archivos del contenedor, pero NO incluye los volúmenes.

---

## Opción 5: Backup de Volúmenes (Datos)

### Hacer backup de la base de datos PostgreSQL
```powershell
# Backup de la base de datos
docker exec alkilo-postgres pg_dump -U postgres alkilo_db > backup.sql

# Restaurar en otro equipo
Get-Content backup.sql | docker exec -i alkilo-postgres psql -U postgres -d alkilo_db
```

### Backup del volumen de MinIO
```powershell
# Crear contenedor temporal para copiar datos
docker run --rm -v alkilo-backend_minio_data:/data -v ${PWD}:/backup alpine tar czf /backup/minio-backup.tar.gz -C /data .

# Restaurar en otro equipo
docker run --rm -v alkilo-backend_minio_data:/data -v ${PWD}:/backup alpine tar xzf /backup/minio-backup.tar.gz -C /data
```

---

## Comandos Útiles

### Ver tamaño de imágenes
```powershell
docker images
```

### Ver volúmenes
```powershell
docker volume ls
```

### Ver información de una imagen
```powershell
docker inspect alkilo-backend:latest
```

### Limpiar imágenes no usadas
```powershell
docker image prune -a
```

### Ver logs de un contenedor
```powershell
docker logs alkilo-backend
docker logs -f alkilo-backend  # Seguir logs en tiempo real
```

---

## Recomendación

Para compartir el proyecto completo con otra persona:

1. **Sube el código a GitHub** (ya lo tienes)
2. **Incluye estos archivos en el repositorio:**
   - `Dockerfile`
   - `docker-compose.yml`
   - `.dockerignore`
   - `README.md` con instrucciones

3. **La otra persona solo necesita:**
   ```powershell
   git clone https://github.com/MikeJpaDev/alkilo-backend.git
   cd alkilo-backend
   docker-compose up -d --build
   ```

4. **Para producción, sube la imagen a Docker Hub:**
   ```powershell
   docker build -t mikejpadev/alkilo-backend:latest .
   docker push mikejpadev/alkilo-backend:latest
   ```

Esto es más eficiente que compartir archivos .tar grandes.
