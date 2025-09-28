const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para CORS y parsing de JSON
app.use(cors());
app.use(express.json());

// URLs de los microservicios (URLs de Vercel)
const USUARIOS_URL = 'https://usuarios-a454-b9hi0wtfc-ofs-projects-1419b589.vercel.app';
const PAGOS_URL = 'https://pagos-mtuf-mnyaeva09-ofs-projects-1419b589.vercel.app';

// Función para hacer proxy a microservicios
async function proxyToMicroservice(baseUrl, req, res) {
  try {
    const path = req.path.replace(/^\/api\/(usuarios|pagos)/, '');
    const url = baseUrl + path;
    
    console.log(`📡 Enviando ${req.method} a ${url}`);
    
    const response = await axios({
      method: req.method,
      url: url,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      }
    });
    
    console.log(`✅ Respuesta exitosa de ${url}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('❌ Error en proxy:', error.message);
    console.error('Detalles:', error.response?.data);
    res.status(error.response?.status || 500).json({
      error: 'Error en comunicación con microservicio',
      mensaje: error.response?.data?.error || error.message
    });
  }
}

// Rutas del API Gateway
// Redirigir peticiones de usuarios al microservicio correspondiente
app.all('/api/usuarios/*', (req, res) => {
  const path = req.path.replace('/api/usuarios', '');
  const url = USUARIOS_URL + path;
  console.log(`🔄 Proxy: ${req.method} ${req.path} -> ${url}`);
  proxyToMicroservice(USUARIOS_URL, req, res);
});

// Redirigir peticiones de pagos al microservicio correspondiente
app.all('/api/pagos/*', (req, res) => {
  const path = req.path.replace('/api/pagos', '');
  const url = PAGOS_URL + path;
  console.log(`🔄 Proxy: ${req.method} ${req.path} -> ${url}`);
  proxyToMicroservice(PAGOS_URL, req, res);
});

// Ruta de salud del gateway
app.get('/health', (req, res) => {
  res.json({ 
    mensaje: 'API Gateway funcionando correctamente',
    timestamp: new Date().toISOString(),
    microservicios: {
      usuarios: USUARIOS_URL,
      pagos: PAGOS_URL
    }
  });
});

// Ruta raíz con información del sistema
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Sistema de Gestión de Inscripciones y Pagos',
    version: '1.0.0',
    arquitectura: 'Microservicios con Firebase',
    endpoints: {
      usuarios: '/api/usuarios',
      pagos: '/api/pagos',
      salud: '/health'
    }
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en API Gateway:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 API Gateway ejecutándose en puerto ${PORT}`);
  console.log(`📡 Redirigiendo peticiones a microservicios:`);
  console.log(`   - Usuarios: ${USUARIOS_URL}`);
  console.log(`   - Pagos: ${PAGOS_URL}`);
});
