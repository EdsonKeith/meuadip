import Associate from '../models/AssociateModel.js';
import { sendConfirmationEmail } from '../config/emailService.js';
import crypto from 'crypto';
import logger from '../config/logger.js';

export const registerAssociate = async (associateData) => {
  try {
    // Validate unique fields
    const existingEmail = await Associate.findOne({ email: associateData.email });
    const existingIdentification = await Associate.findOne({ identificacao: associateData.identificacao });

    if (existingEmail) {
      throw new Error('Email já registado');
    }

    if (existingIdentification) {
      throw new Error('Número de identificação já registado');
    }

    // Generate unique associate number
    const associateNumber = `ADIP-${Date.now().toString().slice(-6)}`;

    const newAssociate = new Associate({
      ...associateData,
      associateNumber,
      status: 'Pendente',
      isActive: true,
      dataCadastro: new Date()
    });

    await newAssociate.save();

    // Send confirmation email
    await sendConfirmationEmail(newAssociate);

    logger.info(`New associate registered: ${newAssociate.email}`);

    return newAssociate;
  } catch (error) {
    logger.error('Error in registerAssociate', error);
    throw error;
  }
};

export const listAssociates = async ({ 
  page = 1, 
  limit = 10, 
  status, 
  nacionalidade,
  search 
}) => {
  try {
    const query = {};

    if (status) query.status = status;
    if (nacionalidade) query.nacionalidade = nacionalidade;
    if (search) {
      query.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { associateNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const totalAssociates = await Associate.countDocuments(query);
    const totalPages = Math.ceil(totalAssociates / limit);

    const associates = await Associate.find(query)
      .select('-password')  // Exclude sensitive data
      .sort({ dataCadastro: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      associates,
      currentPage: page,
      totalPages,
      totalAssociates
    };
  } catch (error) {
    logger.error('Error in listAssociates', error);
    throw error;
  }
};

export const getAssociateById = async (id) => {
  try {
    const associate = await Associate.findById(id).select('-password');
    if (!associate) {
      throw new Error('Associado não encontrado');
    }
    return associate;
  } catch (error) {
    logger.error('Error in getAssociateById', error);
    throw error;
  }
};

export const updateAssociate = async (id, updateData) => {
  try {
    const associate = await Associate.findByIdAndUpdate(
      id, 
      { 
        ...updateData, 
        updatedAt: new Date() 
      }, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!associate) {
      throw new Error('Associado não encontrado');
    }

    logger.info(`Associate updated: ${associate.email}`);
    return associate;
  } catch (error) {
    logger.error('Error in updateAssociate', error);
    throw error;
  }
};

export const deleteAssociate = async (id) => {
  try {
    const associate = await Associate.findByIdAndDelete(id);
    
    if (!associate) {
      throw new Error('Associado não encontrado');
    }

    logger.info(`Associate deleted: ${associate.email}`);
    return associate;
  } catch (error) {
    logger.error('Error in deleteAssociate', error);
    throw error;
  }
};