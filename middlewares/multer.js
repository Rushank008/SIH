const multer = require('multer');

// Just store temporarily in disk (or memory)
const storage = multer.diskStorage({}); // or use memoryStorage()

const upload = multer({ storage }); // no fileFilter

module.exports = upload;