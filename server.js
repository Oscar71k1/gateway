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

async function proxyToMicroservice(baseUrl, req, res) {
  try {
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
      }
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Error en comunicación con microservicio',
      mensaje: error.response?.data?.error || error.message
    });
  }
}

// Proxy para usuarios
app.all('/api/usuarios/*', (req, res) => proxyToMicroservice(USUARIOS_URL, req, res));

// Proxy para pagos
app.all('/api/pagos/*', (req, res) => proxyToMicroservice(PAGOS_URL, req, res));

// Ruta de salud del gateway
app.get('/health', (req, res) => {
  res.json({ mensaje: 'API Gateway funcionando correctamente', microservicios: { usuarios: USUARIOS_URL, pagos: PAGOS_URL } });
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
  });
}

// Exportar app para Vercel
module.exports = app;
