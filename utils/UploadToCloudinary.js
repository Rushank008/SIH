const cloudinary = require('../config/cloudinary'); // your config path

exports.uploadToCloudinaryPrivate = async (filePath, folder = 'certificate-system/uploads') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto',     // auto-detect image/pdf
      type: 'upload',           // 👈 this makes it secure!
    });
    return result; // contains public_id, secure_url, etc.
  } catch (err) {
    console.log(err)
  }
};