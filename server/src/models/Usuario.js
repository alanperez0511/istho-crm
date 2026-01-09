/**
 * ============================================================================
 * ISTHO CRM - Modelo Usuario
 * ============================================================================
 * 
 * Gestiona los usuarios del sistema con autenticación JWT.
 * Incluye hash de contraseñas y control de acceso por roles.
 * 
 * @author Coordinación TI - ISTHO S.A.S.
 * @version 1.1.0
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
      unique: { msg: 'Este nombre de usuario ya está en uso' },
      validate: {
        notEmpty: { msg: 'El username es requerido' },
        len: { args: [3, 50], msg: 'El username debe tener entre 3 y 50 caracteres' },
        isAlphanumeric: { msg: 'El username solo puede contener letras y números' }
      }
    },
    
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'Este email ya está registrado' },
      validate: {
        notEmpty: { msg: 'El email es requerido' },
        isEmail: { msg: 'Debe ser un email válido' }
      }
    },
    
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CAMPOS DE PERFIL
    // ═══════════════════════════════════════════════════════════════════════
    
    nombre: {
      type: DataTypes.STRING(75),
      allowNull: true
    },
    
    apellido: {
      type: DataTypes.STRING(75),
      allowNull: true
    },
    
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    
    cargo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    departamento: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Operaciones'
    },
    
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    
    // ═══════════════════════════════════════════════════════════════════════
    // CAMPOS DE CONTROL
    // ═══════════════════════════════════════════════════════════════════════
    
    rol: {
      type: DataTypes.ENUM('admin', 'supervisor', 'operador', 'cliente'),
      defaultValue: 'operador'
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
    
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
      { fields: ['rol'] },
      { fields: ['activo'] }
    ],
    
    hooks: {
      beforeCreate: async (usuario) => {
        // Hash password
        if (usuario.password_hash) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
        // Sincronizar nombre_completo
        usuario.sincronizarNombreCompleto();
      },
      
      beforeUpdate: async (usuario) => {
        // Hash password si cambió
        if (usuario.changed('password_hash')) {
          const salt = await bcrypt.genSalt(12);
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, salt);
        }
        // Sincronizar nombre_completo si cambió nombre o apellido
        if (usuario.changed('nombre') || usuario.changed('apellido')) {
          usuario.sincronizarNombreCompleto();
        }
      }
    }
  });

  // ============================================
  // MÉTODOS DE INSTANCIA
  // ============================================

  /**
   * Sincronizar nombre_completo desde nombre y apellido
   */
  Usuario.prototype.sincronizarNombreCompleto = function() {
    if (this.nombre || this.apellido) {
      this.nombre_completo = `${this.nombre || ''} ${this.apellido || ''}`.trim();
    }
  };

  /**
   * Verificar contraseña
   */
  Usuario.prototype.verificarPassword = async function(password) {
    return await bcrypt.compare(password, this.password_hash);
  };

  /**
   * Verificar si el usuario está bloqueado
   */
  Usuario.prototype.estaBloqueado = function() {
    if (!this.bloqueado_hasta) return false;
    return new Date() < new Date(this.bloqueado_hasta);
  };

  /**
   * Obtener nombre para mostrar
   */
  Usuario.prototype.getNombreDisplay = function() {
    if (this.nombre || this.apellido) {
      return `${this.nombre || ''} ${this.apellido || ''}`.trim();
    }
    return this.nombre_completo || this.username;
  };

  /**
   * Obtener datos públicos (sin password ni tokens)
   * ÚNICO PUNTO DE VERDAD para datos de usuario
   */
  Usuario.prototype.toPublicJSON = function() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      nombre: this.nombre || null,
      apellido: this.apellido || null,
      nombre_completo: this.nombre_completo || this.getNombreDisplay(),
      telefono: this.telefono || null,
      cargo: this.cargo || null,
      departamento: this.departamento || 'Operaciones',
      avatar_url: this.avatar_url || null,
      rol: this.rol,
      activo: this.activo,
      estado: this.activo ? 'activo' : 'inactivo',
      ultimo_acceso: this.ultimo_acceso,
      created_at: this.created_at
    };
  };

  // ============================================
  // MÉTODOS ESTÁTICOS
  // ============================================

  Usuario.findByEmail = async function(email) {
    return await this.findOne({ where: { email: email.toLowerCase() } });
  };

  Usuario.findByUsername = async function(username) {
    return await this.findOne({ where: { username } });
  };

  Usuario.crearConPassword = async function(datos) {
    const { password, ...resto } = datos;
    return await this.create({ ...resto, password_hash: password });
  };

  return Usuario;
};