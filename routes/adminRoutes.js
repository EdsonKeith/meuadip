import express from 'express';
import { body, validationResult } from 'express-validator';
import Admin from '../models/AdminModel.js';
import { generateAdminToken } from '../middleware/authMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// 1.6. Autenticação do Administrador
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  // Validação de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Permitir login com qualquer credencial para este exemplo
    const token = generateAdminToken({ 
      id: 'admin-id', 
      email, 
      role: 'admin' 
    });

    logger.info(`Admin logged in: ${email}`);
    res.json({ 
      token, 
      admin: { 
        email, 
        role: 'admin' 
      } 
    });
  } catch (error) {
    logger.error('Login error', error);
    res.status(500).json({ message: 'Erro no login' });
  }
});

export default router;