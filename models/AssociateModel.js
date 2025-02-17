import mongoose from 'mongoose';
import crypto from 'crypto';

const associateSchema = new mongoose.Schema({
  nome: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefone: {
    type: String,
    required: true,
    trim: true,
    match: [/^(\+\d{2,3})?[\s]?\d{9,11}$/, 'Número de telefone inválido']
  },
  dataNascimento: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        const age = new Date().getFullYear() - v.getFullYear();
        return age >= 18;
      },
      message: 'Deve ter pelo menos 18 anos'
    }
  },
  nacionalidade: {
    type: String,
    required: true,
    enum: [
      'Brasil', 
      'Angola', 
      'Moçambique', 
      'Cabo Verde', 
      'Guiné-Bissau', 
      'São Tomé e Príncipe', 
      'Outro'
    ]
  },
  identificacao: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{9,14}$/.test(v);
      },
      message: 'Número de identificação inválido'
    }
  },
  associateNumber: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['Pendente', 'Aprovado', 'Rejeitado'],
    default: 'Pendente'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dataCadastro: {
    type: Date,
    default: Date.now
  },
  observations: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date,
    default: null
  },
  interesse: {
    type: String,
    enum: [
      'Apoio Legal', 
      'Integração Social', 
      'Oportunidades de Trabalho', 
      'Educação', 
      'Cultura e Comunidade', 
      'Outro'
    ]
  },
  endereco: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular idade
associateSchema.virtual('idade').get(function() {
  return new Date().getFullYear() - this.dataNascimento.getFullYear();
});

export default mongoose.model('Associate', associateSchema);