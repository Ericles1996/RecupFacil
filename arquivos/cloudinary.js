const cloudinary = require('cloudinary').v2;

// Se CLOUDINARY_URL estiver definida, o SDK usa automaticamente.
// Ainda assim, damos suporte a variáveis separadas.
const cfg = {};
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cfg.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  cfg.api_key = process.env.CLOUDINARY_API_KEY;
  cfg.api_secret = process.env.CLOUDINARY_API_SECRET;
}
cfg.secure = true;

cloudinary.config(cfg);

module.exports = cloudinary;

