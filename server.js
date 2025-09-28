const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const USUARIOS_URL = 'https://usuarios-a454-b9hi0wtfc-ofs-projects-1419b589.vercel.app';
const PAGOS_URL = 'https://pagos-mtuf-mnyaeva09-ofs-projects-1419b589.vercel.app';

async function proxyToMicroservice(baseUrl, req, res) {
  try {
    const path = req.path.replace(/^\/api\/(usuarios|pagos)/, '');
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

module.exports = app;
