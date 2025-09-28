# Despliegue en Render - API Gateway

## Configuración para Render

Este API Gateway está configurado para desplegarse en Render.com y actúa como punto de entrada único para todos los microservicios.

### Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el dashboard de Render:

```
NODE_ENV=production
PORT=10000
USUARIOS_URL=https://usuarios-vsao.onrender.com
PAGOS_URL=https://pagos-oqwf.onrender.com
```

### Endpoints Disponibles

- `GET /health` - Health check para Render
- `GET /` - Información del sistema
- `ALL /api/usuarios/*` - Proxy a microservicio de usuarios
- `ALL /api/pagos/*` - Proxy a microservicio de pagos

### Configuración de Render

1. Conecta tu repositorio de GitHub
2. Selecciona el directorio `gateway`
3. Usa las siguientes configuraciones:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### Funcionamiento del Gateway

El API Gateway actúa como un proxy inteligente que:

1. **Recibe todas las peticiones** del frontend
2. **Redirige automáticamente** a los microservicios correspondientes:
   - `/api/usuarios/*` → Microservicio de Usuarios
   - `/api/pagos/*` → Microservicio de Pagos
3. **Mantiene la autenticación** y headers originales
4. **Maneja errores** de comunicación entre microservicios

### Flujo de Peticiones

```
Frontend → API Gateway → Microservicios
    ↓           ↓            ↓
   /api/usuarios/login → usuarios-vsao.onrender.com/api/login
   /api/pagos/crear → pagos-oqwf.onrender.com/crear
```

### Notas Importantes

- **Punto de entrada único**: Todas las peticiones pasan por el gateway
- **Transparente**: El frontend no necesita conocer las URLs de los microservicios
- **Escalable**: Fácil agregar nuevos microservicios
- **Monitoreo centralizado**: Un solo punto para logs y métricas
- **CORS configurado**: Permite peticiones desde cualquier origen

### Ventajas del Gateway

- ✅ **URL única** para el frontend
- ✅ **Enrutamiento automático** a microservicios
- ✅ **Manejo centralizado** de errores
- ✅ **Fácil escalabilidad** para nuevos servicios
- ✅ **Monitoreo centralizado**


