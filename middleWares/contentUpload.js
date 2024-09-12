const multer = require("multer");
const path = require("path");

module.exports = function (UPLOADS_FOLDER) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_FOLDER); // Use the provided destination folder
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const filename =
        file.originalname
          .replace(fileExt, "")
          .toLocaleLowerCase()
          .split(" ")
          .join("-") +
        "-" +
        Date.now();

      cb(null, filename + fileExt);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'video/mp4' || 
      file.mimetype === 'image/png' || 
      file.mimetype === 'image/jpeg' || 
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/heif' || // MIME type for HEIF
      file.mimetype === 'video/hevc'    // MIME type for HEVC
    ) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"));
    }
  };

  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
  });

  const uploadContent = upload.fields([{ name: 'videoData', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]);

  return uploadContent; // Return the configured multer upload middleware
};
