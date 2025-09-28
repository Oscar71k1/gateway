const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USUARIOS_URL = process.env.USUARIOS_URL || 'https://usuarios-vsao.onrender.com';
const PAGOS_URL = process.env.PAGOS_URL || 'https://pagos-oqwf.onrender.com';

async function wakeUpService(baseUrl) {
  try {
    // Intentar hacer un ping al servicio para despertarlo
    await axios.get(baseUrl, { timeout: 10000 });
    console.log(`✅ Servicio despierto: ${baseUrl}`);
    return true;
  } catch (error) {
    console.log(`⏳ Despertando servicio: ${baseUrl}`);
    return false;
  }
}

async function proxyToMicroservice(baseUrl, req, res) {
  try {
    // Intentar despertar el servicio primero
    await wakeUpService(baseUrl);
    
    let path = req.path.replace(/^\/api\/(usuarios|pagos)/, '');
    
    // Si es usuarios, mantener el prefijo /api
    if (req.path.startsWith('/api/usuarios')) {
      path = '/api' + path;
    }
    
    const url = baseUrl + path;

    const response = await axios({
      method: req.method,
      url,
      data: req.body,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      timeout: 45000 // 45 segundos para cold starts
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`❌ Error en ${baseUrl}:`, error.message);
    
    // Si es un error 502, intentar despertar el servicio y reintentar
    if (error.response?.status === 502) {
      console.log(`🔄 Reintentando después de error 502...`);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        const retryResponse = await axios({
          method: req.method,
          url: baseUrl + (req.path.startsWith('/api/usuarios') ? '/api' + req.path.replace('/api/usuarios', '') : req.path.replace('/api/pagos', '')),
          data: req.body,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization || ''
          },
          timeout: 45000
        });
        res.status(retryResponse.status).json(retryResponse.data);
        return;
      } catch (retryError) {
        console.error(`❌ Error en reintento:`, retryError.message);
      }
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Error en comunicación con microservicio',
      mensaje: error.response?.data?.error || error.message,
      servicio: baseUrl
    });
  }
}

// Proxy para usuarios
app.all('/api/usuarios/*', (req, res) => proxyToMicroservice(USUARIOS_URL, req, res));

// Proxy para pagos
app.all('/api/pagos/*', (req, res) => proxyToMicroservice(PAGOS_URL, req, res));

// Sistema de keep-alive para mantener servicios activos
let keepAliveInterval;

function startKeepAlive() {
  if (keepAliveInterval) return;
  
  keepAliveInterval = setInterval(async () => {
    try {
      console.log('🔄 Ejecutando keep-alive...');
      await Promise.all([
        axios.get(USUARIOS_URL, { timeout: 10000 }).catch(() => {}),
        axios.get(PAGOS_URL, { timeout: 10000 }).catch(() => {})
      ]);
      console.log('✅ Keep-alive completado');
    } catch (error) {
      console.log('⚠️ Keep-alive falló:', error.message);
    }
  }, 30000); // Cada 30 segundos
}

// Ruta de salud del gateway
app.get('/health', (req, res) => {
  res.json({ 
    mensaje: 'API Gateway funcionando correctamente', 
    timestamp: new Date().toISOString(),
    microservicios: { 
      usuarios: USUARIOS_URL, 
      pagos: PAGOS_URL 
    },
    keepAlive: keepAliveInterval ? 'activo' : 'inactivo'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: 'Sistema de Gestión de Inscripciones y Pagos', endpoints: { usuarios: '/api/usuarios', pagos: '/api/pagos', salud: '/health' } });
});

// Iniciar servidor solo si no estamos en Vercel
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Gateway ejecutándose en puerto ${PORT}`);
    console.log(`🔗 Microservicios conectados:`);
    console.log(`   - Usuarios: ${USUARIOS_URL}`);
    console.log(`   - Pagos: ${PAGOS_URL}`);
    console.log(`📊 Health check disponible en: http://localhost:${PORT}/health`);
    
    // Iniciar keep-alive después de 5 segundos
    setTimeout(() => {
      startKeepAlive();
      console.log(`🔄 Keep-alive iniciado (cada 30 segundos)`);
    }, 5000);
  });
}

// Exportar app para Vercel
module.exports = app;
