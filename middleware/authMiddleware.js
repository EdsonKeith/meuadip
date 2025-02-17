import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

export const generateToken = (payload, expiresIn = '1h') => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    logger.error('Token verification failed', error);
    return null;
  }
};

export const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Autenticação necessária' 
    });
  }

  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== 'admin') {
    return res.status(403).json({ 
      status: 'error',
      message: 'Acesso não autorizado' 
    });
  }

  req.admin = decoded;
  next();
};