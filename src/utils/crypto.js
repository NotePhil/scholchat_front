import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'scholchat-secure-key-2024-v1-32b';

export const encryptPassword = (password) => {
  return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
};

export const hashPassword = (password) => {
  return CryptoJS.SHA256(password).toString();
};