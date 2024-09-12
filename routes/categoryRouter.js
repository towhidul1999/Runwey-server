const express = require('express');
const fs = require('fs');
const { createCategory, updateCategory, getCategory, deleteCategory } = require('../controllers/categoryController');
const router = express.Router();
const configureFileUpload = require("../middleWares/fileUpload");
const userauthmiddleware = require("../middleWares/auth");
/* GET category listing. */
// router.post('/', userauthmiddleware.isValidUser, configureFileUpload(), createCategory);
// Assuming your destination path is "public/uploads"

const UPLOADS_FOLDER_USERS = "../public/image";
const uploadContent = configureFileUpload(UPLOADS_FOLDER_USERS);

const createFolderIfNotExists = (folderPath) => {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  };

  createFolderIfNotExists(UPLOADS_FOLDER_USERS);

router.post('/', userauthmiddleware.isValidUser, [uploadContent], createCategory);

router.put('/:id', userauthmiddleware.isValidUser, [uploadContent], updateCategory);
router.get('/', getCategory);
router.delete('/:id', userauthmiddleware.isValidUser, deleteCategory);

module.exports = router;