import express from 'express';
import { body, validationResult } from 'express-validator';
import Associate from '../models/AssociateModel.js';
import logger from '../config/logger.js';
import crypto from 'crypto';

const router = express.Router();

// Registro de Associado
router.post('/register', [
  // Validação de campos
  body('nome')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Nome deve ter entre 3 e 100 caracteres'),
  
  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('telefone')
    .trim()
    .matches(/^(\+\d{2,3})?[\s]?\d{9,11}$/)
    .withMessage('Número de telefone inválido'),
  
  body('dataNascimento')
    .isDate()
    .withMessage('Data de nascimento inválida')
    .custom((value) => {
      const birthDate = new Date(value);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      
      if (birthDate > minAge) {
        throw new Error('Deve ter pelo menos 18 anos');
      }
      return true;
    }),
  
  body('nacionalidade')
    .not()
    .isEmpty()
    .withMessage('Nacionalidade é obrigatória'),
  
  body('identificacao')
    .trim()
    .matches(/^\d{9,14}$/)
    .withMessage('Número de identificação inválido')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  try {
    const { 
      nome, 
      email, 
      telefone, 
      dataNascimento, 
      nacionalidade, 
      identificacao 
    } = req.body;

    // Verificar se o email já existe
    const existingAssociate = await Associate.findOne({ email });
    if (existingAssociate) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já registado'
      });
    }

    // Gerar número de associado único
    const associateNumber = `ADIP-${Date.now().toString().slice(-6)}`;

    const newAssociate = new Associate({
      nome,
      email,
      telefone,
      dataNascimento: new Date(dataNascimento),
      nacionalidade,
      identificacao,
      associateNumber,
      status: 'Pendente',
      isActive: true
    });

    await newAssociate.save();

    logger.info(`Novo associado registado: ${email}`);

    res.status(201).json({
      status: 'success',
      message: 'Registro bem-sucedido',
      associateNumber: newAssociate.associateNumber
    });

  } catch (error) {
    logger.error('Erro no registro de associado', error);
    res.status(500).json({
      status: 'error', 
      message: 'Erro no registro. Por favor, tente novamente.'
    });
  }
});

// Simplified Login Route with Test Mode Support
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Palavra-passe é obrigatória')
], async (req, res) => {
  // Always allow login in test mode
  const { email } = req.body;
  
  // Create a test associate if not exists
  let associate = await Associate.findOne({ email });
  if (!associate) {
    associate = new Associate({
      nome: 'Utilizador de Teste',
      email,
      telefone: '+351 926 479 393',
      dataNascimento: new Date(),
      nacionalidade: 'Não Especificada',
      endereco: 'Endereço de Teste',
      identificacao: crypto.randomBytes(10).toString('hex'),
      interesse: 'Teste',
      associateNumber: `TEST-${Date.now()}`,
      status: 'Aprovado',
      isAutoCreated: true
    });

    await associate.save();
  }

  // Generate a token for the test user
  const token = associate.generateAuthToken();

  return res.json({ 
    status: 'success',
    message: 'Login em modo de teste',
    token, 
    associate: { 
      id: associate._id,
      nome: associate.nome,
      email: associate.email,
      associateNumber: associate.associateNumber,
      status: associate.status
    } 
  });
});

export default router;