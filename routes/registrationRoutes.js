import express from 'express';
import { body, validationResult } from 'express-validator';
import { 
    registerAssociate, 
    listAssociates, 
    updateAssociate, 
    deleteAssociate 
} from '../controllers/associateController.js';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import logger from '../config/logger.js';

const router = express.Router();

// Comprehensive Associate Registration Validation
const registrationValidations = [
    body('nome')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Nome deve ter entre 3 e 100 caracteres')
        .matches(/^[A-Za-zÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras'),
    
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
        .withMessage('Número de identificação inválido'),
    
    body('endereco')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Endereço deve ter pelo menos 10 caracteres'),
    
    body('interesse')
        .not()
        .isEmpty()
        .withMessage('Principal interesse é obrigatório')
];

// Public Registration Endpoint
router.post('/register', registrationValidations, async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }

    try {
        const newAssociate = await registerAssociate(req.body);
        
        logger.info(`New associate registered: ${newAssociate.email}`);

        res.status(201).json({
            status: 'success',
            message: 'Registro bem-sucedido',
            associate: {
                id: newAssociate._id,
                nome: newAssociate.nome,
                associateNumber: newAssociate.associateNumber
            }
        });

    } catch (error) {
        logger.error('Associate registration error', error);
        res.status(500).json({
            status: 'error', 
            message: error.message || 'Erro no registro. Por favor, tente novamente.'
        });
    }
});

// Protected Admin Routes
router.use(authenticateAdmin);

// List Associates with Advanced Filtering
router.get('/list', async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            nacionalidade,
            search
        } = req.query;

        const associates = await listAssociates({
            page: Number(page),
            limit: Number(limit),
            status,
            nacionalidade,
            search
        });

        res.json({
            status: 'success',
            ...associates
        });
    } catch (error) {
        logger.error('Error listing associates', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao listar associados'
        });
    }
});

// Update Associate
router.put('/:id', registrationValidations, async (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            errors: errors.array()
        });
    }

    try {
        const updatedAssociate = await updateAssociate(req.params.id, req.body);
        res.json({
            status: 'success',
            associate: updatedAssociate
        });
    } catch (error) {
        logger.error('Error updating associate', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao atualizar associado'
        });
    }
});

// Delete Associate
router.delete('/:id', async (req, res) => {
    try {
        await deleteAssociate(req.params.id);
        res.json({
            status: 'success',
            message: 'Associado removido com sucesso'
        });
    } catch (error) {
        logger.error('Error deleting associate', error);
        res.status(500).json({
            status: 'error',
            message: 'Erro ao remover associado'
        });
    }
});

export default router;