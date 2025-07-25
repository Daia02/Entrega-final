import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Usuarios de ejemplo (en producción, esto debería estar en una base de datos)
const users = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    password: "$2b$10$rQJbX.3y0nZ8fLGqF3XxLeaKgGfg4Nv8f8DzSi9xP2X2Gzw2zF2xO", // password: "admin123"
    role: "admin"
  },
  {
    id: "2",
    username: "manager",
    email: "manager@example.com",
    password: "$2b$10$rQJbX.3y0nZ8fLGqF3XxLeaKgGfg4Nv8f8DzSi9xP2X2Gzw2zF2xO", // password: "manager123"
    role: "manager"
  }
];

// Validar configuración de JWT
const validateJWTConfig = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado en las variables de entorno");
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.warn("⚠️  JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad");
  }
};

// Generar token JWT
const generateToken = (user) => {
  validateJWTConfig();
  
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
      issuer: "auth-service",
      audience: "app-users"
    }
  );
};

// Validar formato de email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar fortaleza de contraseña
const isValidPassword = (password) => {
  // Al menos 8 caracteres, una mayúscula, una minúscula, un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar datos de entrada
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario y contraseña son requeridos"
      });
    }

    // Sanitizar entrada
    const sanitizedUsername = username.trim().toLowerCase();

    // Buscar usuario
    const user = users.find(u => 
      u.username.toLowerCase() === sanitizedUsername || 
      u.email.toLowerCase() === sanitizedUsername
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Generar token
    const token = generateToken(user);

    // Respuesta exitosa (no incluir la contraseña)
    res.status(200).json({
      success: true,
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Registro
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validar datos de entrada
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Usuario, email y contraseña son requeridos"
      });
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Formato de email inválido"
      });
    }

    // Validar fortaleza de contraseña
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
      });
    }

    // Sanitizar datos
    const sanitizedUsername = username.trim().toLowerCase();
    const sanitizedEmail = email.trim().toLowerCase();

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => 
      u.username.toLowerCase() === sanitizedUsername || 
      u.email.toLowerCase() === sanitizedEmail
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El usuario o email ya existe"
      });
    }

    // Hash de la contraseña
    const saltRounds = 12; // Incrementado para mayor seguridad
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario (en producción, guardar en BD)
    const newUser = {
      id: Date.now().toString(),
      username: sanitizedUsername,
      email: sanitizedEmail,
      password: hashedPassword,
      role: "user", // rol por defecto
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generar token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    });

  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = (req, res) => {
  try {
    // req.user debe ser añadido por el middleware de autenticación
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    res.status(200).json({
      success: true,
      message: "Perfil obtenido exitosamente",
      data: {
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

// Refresh token
export const refreshToken = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }

    const user = req.user;
    const newToken = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Token renovado exitosamente",
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    });
  } catch (error) {
    console.error("Error en refreshToken:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};



// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual y nueva contraseña son requeridas"
      });
    }

    // Validar nueva contraseña
    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
      });
    }

    // Buscar usuario
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const user = users[userIndex];

    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual incorrecta"
      });
    }

    // Hash de la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    users[userIndex].password = hashedNewPassword;

    res.status(200).json({
      success: true,
      message: "Contraseña cambiada exitosamente"
    });

  } catch (error) {
    console.error("Error en changePassword:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};