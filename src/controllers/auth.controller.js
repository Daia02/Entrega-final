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

// Generar token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h"
    }
  );
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

    // Buscar usuario
    const user = users.find(u => u.username === username || u.email === username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
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
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Registro (opcional)
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

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.username === username || u.email === email);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "El usuario o email ya existe"
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear nuevo usuario (en producción, guardar en BD)
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      role: "user" // rol por defecto
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
          role: newUser.role
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || "24h"
      }
    });

  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error("Error en getProfile:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Refresh token
export const refreshToken = (req, res) => {
  try {
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
      message: "Error interno del servidor",
      error: error.message