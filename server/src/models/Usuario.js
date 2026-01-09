/**
 * ISTHO CRM - Modelo Usuario
 * 
 * Gestiona los usuarios del sistema con autenticación JWT.
 * Incluye hash de contraseñas y control de acceso por roles.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.0.0
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Este nombre de usuario ya está en uso'
      },
      validate: {
        notEmpty: { msg: 'El username es requerido' },
        len: {
          args: [3, 50],
          msg: 'El username debe tener entre 3 y 50 caracteres'
        },
        isAlphanumeric: {
          msg: 'El username solo puede contener letras y números'
        }
      }
    },
    
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'Este email ya está registrado'
      },
      validate: {
        notEmpty: { msg: 'El email es requerido' },
        isEmail: { msg: 'Debe ser un email válido' }
      }
    },
    
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre completo es requerido' },
        len: {
          args: [3, 150],
          msg: 'El nombre debe tener entre 3 y 150 caracteres'
        }
      }
    },
    
    rol: {
      type: DataTypes.ENUM('admin', 'supervisor', 'operador', 'cliente'),
      defaultValue: 'operador',
      validate: {
        isIn: {
          args: [['admin', 'supervisor', 'operador', 'cliente']],
          msg: 'Rol no válido'
        }
      }
    },
    
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    intentos_fallidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    
    bloqueado_hasta: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    underscored: true,
    
    // Índices para optimizar búsquedas
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
      { fields: ['rol'] },
      { fields: ['activo'] }
    ],
    
    // Hooks del modelo
    hooks: {
      // Hash de contraseña antes de crear
      beforeCreate: async (usuario) => {
        if (usuario.password_hash) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
      },
      
      // Hash de contraseña antes de actualizar (si cambió)
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password_hash')) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
      }
    }
  });

  // ============================================
  // MÉTODOS DE INSTANCIA
  // ============================================

  /**
   * Verificar contraseña
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<boolean>}
   */
  Usuario.prototype.verificarPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  /**
   * Verificar si el usuario está bloqueado
   * @returns {boolean}
   */
  Usuario.prototype.estaBloqueado = function() {
    if (!this.bloqueado_hasta) return false;
    return new Date() < new Date(this.bloqueado_hasta);
  };

  /**
   * Obtener datos públicos (sin password)
   * @returns {Object}
   */
  Usuario.prototype.toPublicJSON = function() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      nombre_completo: this.nombre_completo,
      rol: this.rol,
      activo: this.activo,
      ultimo_acceso: this.ultimo_acceso,
      created_at: this.created_at
    };
  };

  // ============================================
  // MÉTODOS DE CLASE (ESTÁTICOS)
  // ============================================

  /**
   * Buscar usuario por email
   * @param {string} email 
   * @returns {Promise<Usuario|null>}
   */
  Usuario.findByEmail = async function(email) {
    return await this.findOne({ 
      where: { email: email.toLowerCase() } 
    });
  };

  /**
   * Buscar usuario por username
   * @param {string} username 
   * @returns {Promise<Usuario|null>}
   */
  Usuario.findByUsername = async function(username) {
    return await this.findOne({ 
      where: { username } 
    });
  };

  /**
   * Crear usuario con password (helper)
   * @param {Object} datos - Datos del usuario incluyendo password
   * @returns {Promise<Usuario>}
   */
  Usuario.crearConPassword = async function(datos) {
    const { password, ...resto } = datos;
    return await this.create({
      ...resto,
      password_hash: password // El hook lo hasheará
    });
  };

  return Usuario;
};