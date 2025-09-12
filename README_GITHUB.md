# Configuración de GitHub como Backend

## Pasos para configurar GitHub como backend de sincronización:

### 1. Crear un repositorio en GitHub
- Ve a https://github.com/new
- Crea un nuevo repositorio (puede ser privado)
- Nombre sugerido: `reportes-udp-data`

### 2. Crear un Personal Access Token
1. Ve a https://github.com/settings/tokens/new
2. Dale un nombre descriptivo (ej: "Token Reportes UDP")
3. Selecciona estos permisos:
   - `repo` (acceso completo al repositorio)
4. Copia el token generado (empieza con `ghp_`)
   - **IMPORTANTE**: Guárdalo bien, no lo podrás ver de nuevo

### 3. Configurar la aplicación
1. Abre la aplicación de reportes
2. Haz clic en el botón "⚙️ Config GitHub" en el header
3. Completa los campos:
   - **Usuario de GitHub**: tu nombre de usuario
   - **Repositorio**: nombre del repo creado en paso 1
   - **Personal Access Token**: el token del paso 2
4. Haz clic en "Probar Conexión" para verificar
5. Si la conexión es exitosa, haz clic en "Guardar"

### 4. Estructura de datos en GitHub
La aplicación creará automáticamente estos archivos en tu repositorio:
```
data/
├── usuarios.json     # Lista de usuarios
├── reportes.json     # Reportes guardados
└── metadata.json     # Información de sincronización
```

### 5. Sincronización
- **Automática**: Los datos se sincronizan al guardar
- **Manual**: Usa el botón "☁️ Sincronizar" en borradores
- **Panel Admin**: Botón "🔄 Sincronizar con GitHub"

### 6. Ventajas de usar GitHub
- ✅ Gratis para repositorios privados
- ✅ Control de versiones automático
- ✅ Historial de cambios completo
- ✅ Sin límites de almacenamiento razonables
- ✅ Acceso desde cualquier lugar
- ✅ Backup automático

### 7. Solución de problemas
- **Error 401**: Token incorrecto o expirado
- **Error 404**: Repositorio no existe o usuario/repo mal escrito
- **Error 422**: Conflicto de datos, intenta sincronizar de nuevo

### 8. Seguridad
- El token se guarda en localStorage del navegador
- Usa repositorios privados para datos sensibles
- Rota el token periódicamente por seguridad