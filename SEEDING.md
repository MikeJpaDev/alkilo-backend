# Seeders del Proyecto

## Datos Sembrados

### Usuarios (10 usuarios)
Todos con contraseña: `Password123!`

1. Carlos García - carlos.garcia@example.com
2. María Rodríguez - maria.rodriguez@example.com
3. José Fernández - jose.fernandez@example.com
4. Ana Martínez - ana.martinez@example.com
5. Luis López - luis.lopez@example.com
6. Carmen Pérez - carmen.perez@example.com
7. Pedro González - pedro.gonzalez@example.com
8. Laura Sánchez - laura.sanchez@example.com
9. Roberto Díaz - roberto.diaz@example.com
10. Isabel Torres - isabel.torres@example.com

### Casas (12 casas)
Distribuidas en diferentes provincias y municipios de Cuba:

- **La Habana**: 6 casas (Vedado, Miramar, Habana Vieja)
- **Matanzas**: 1 casa (Varadero)
- **Sancti Spíritus**: 1 casa (Trinidad)
- **Cienfuegos**: 1 casa (Cienfuegos)
- **Camagüey**: 1 casa (Camagüey)
- **Santiago de Cuba**: 1 casa (Santiago de Cuba)
- **Villa Clara**: 1 casa (Santa Clara)

### Provincias y Municipios
- 16 provincias
- 168 municipios de Cuba

## Orden de Seeding

Los seeders se ejecutan automáticamente al iniciar la aplicación en el siguiente orden:

1. **Provincias y Municipios** (`SeedService`)
2. **Usuarios** (`DataSeedService.seedUsers()`)
3. **Casas** (`DataSeedService.seedCasas()`)

## Cómo Limpiar y Resembrar

Si necesitas limpiar la base de datos y resembrar:

1. Conectarse a PostgreSQL:
   ```bash
   docker exec -it alkilo-postgres psql -U postgres -d alkilo_db
   ```

2. Limpiar las tablas (en orden inverso por las foreign keys):
   ```sql
   TRUNCATE TABLE reviews CASCADE;
   TRUNCATE TABLE "contact-phone" CASCADE;
   TRUNCATE TABLE casas CASCADE;
   TRUNCATE TABLE "user" CASCADE;
   TRUNCATE TABLE municipalities CASCADE;
   TRUNCATE TABLE provinces CASCADE;
   ```

3. Salir de PostgreSQL:
   ```
   \q
   ```

4. Reiniciar el servidor (los seeders se ejecutarán automáticamente):
   ```bash
   npm run start:dev
   ```

## Notas

- Los seeders solo se ejecutan si las tablas están vacías
- Si ya existen datos, verás el mensaje "✓ [Entity] already seeded"
- Las contraseñas están hasheadas con bcrypt (10 rounds)
- Todos los usuarios tienen el rol "user"
