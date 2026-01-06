// Integrations - Firebase service exports
// Base44 integrations-ийг Firebase service-ээр солих

import { uploadFile, uploadPrivateFile } from '@/services/storageService';

// UploadFile - Firebase Storage ашиглах
export const UploadFile = async ({ file }) => {
  return await uploadFile(file);
};

// UploadPrivateFile - Firebase Storage ашиглах
export const UploadPrivateFile = async ({ file, userId }) => {
  return await uploadPrivateFile(file, userId);
};

// Core integrations wrapper
export const Core = {
  UploadFile,
  UploadPrivateFile,
  // Бусад integrations хэрэгтэй бол энд нэмэх
  InvokeLLM: async () => {
    throw new Error('InvokeLLM is not implemented - use aiService instead');
  },
  SendEmail: async () => {
    throw new Error('SendEmail is not implemented yet');
  },
  GenerateImage: async () => {
    throw new Error('GenerateImage is not implemented yet');
  },
  ExtractDataFromUploadedFile: async () => {
    throw new Error('ExtractDataFromUploadedFile is not implemented yet');
  },
  CreateFileSignedUrl: async () => {
    throw new Error('CreateFileSignedUrl is not implemented yet');
  }
};

// Export individual functions for backward compatibility
export { UploadFile as InvokeLLM };
export { UploadFile as SendEmail };
export { UploadFile as GenerateImage };
export { UploadFile as ExtractDataFromUploadedFile };
export { UploadFile as CreateFileSignedUrl };
