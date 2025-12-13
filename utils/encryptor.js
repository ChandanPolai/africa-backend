import cryptoJS from 'crypto-js';

export const encrypt = (plainPassword) => {
  return cryptoJS.AES.encrypt(plainPassword, process.env.PASSWORD_SECRET).toString();
};

export const decrypt = (encryptedText) => {
  const decryptedLayer = cryptoJS.AES.decrypt(encryptedText, process.env.PASSWORD_SECRET);
  return decryptedLayer.toString(cryptoJS.enc.Utf8);
};
