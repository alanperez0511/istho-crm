/**
 * ISTHO CRM - Configuración de Multer
 * 
 * Configuración para subida de archivos.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Crear directorios si no existen
const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Directorios de uploads
const UPLOAD_DIRS = {
  averias: path.join(__dirname, '../../uploads/averias'),
  cumplidos: path.join(__dirname, '../../uploads/cumplidos'),
  temp: path.join(__dirname, '../../uploads/temp')
};

// Crear directorios
Object.values(UPLOAD_DIRS).forEach(createDir);

/**
 * Configuración de almacenamiento para averías (imágenes)
 */
const storageAverias = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.averias);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `averia_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

/**
 * Configuración de almacenamiento para cumplidos (documentos)
 */
const storageCumplidos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIRS.cumplidos);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `cumplido_${Date.now()}_${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

/**
 * Filtro para imágenes
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'), false);
  }
};

/**
 * Filtro para documentos
 */
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

/**
 * Upload para evidencias de averías
 */
const uploadAveria = multer({
  storage: storageAverias,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

/**
 * Upload para documentos de cumplido
 */
const uploadCumplido = multer({
  storage: storageCumplidos,
  fileFilter: documentFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

module.exports = {
  uploadAveria,
  uploadCumplido,
  UPLOAD_DIRS
};