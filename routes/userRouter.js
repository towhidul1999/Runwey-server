const express = require('express');
const { signUp, signIn, processForgetPassword, verifyOneTimeCode, updatePassword, profileData, userToCreator, requestUserToCreator, subscribe, allUsers, allRequestedUser, userDetails, updateProfile, pendingCreator, genderRatio, changePasword, getLoginActivities, cancelCreatorRequest, bannedUser, swapUserRole } = require('../controllers/userController');
const router = express.Router();
const { isValidUser } = require("../middleWares/auth");
//file upload middleware]
const fs = require("fs");
const configureFileUpload = require("../middleWares/fileUpload");
const { calculate } = require('../controllers/contentCotroller');
const UPLOADS_FOLDER_USERS = "../public/images";
const uploadContent = configureFileUpload(UPLOADS_FOLDER_USERS); // Corrected function name

// Function to create folder if not present
const createFolderIfNotExists = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

createFolderIfNotExists(UPLOADS_FOLDER_USERS);

/* GET users listing. */
router.post('/sign-up', signUp);
router.post('/sign-in', signIn);
router.put('/update', [uploadContent], isValidUser, updateProfile);
router.post('/forget-password', processForgetPassword);
router.post('/verify', verifyOneTimeCode);
router.post('/update-password', updatePassword);
router.get('/profile-data', isValidUser, profileData);
router.post('/accept-creator/:id', userToCreator);
router.get('/details', userDetails);
router.get('/sort', allUsers);
router.get('/request', allRequestedUser);
router.get('/pending-creator/:id', isValidUser, pendingCreator);
router.get('/pending-creator-list', isValidUser, allRequestedUser);
router.get('/gender-ratio', isValidUser, genderRatio);
// router.get('/gender-ratio', isValidUser, genderRatio);
router.post('/change-password', isValidUser, changePasword);
router.get('/login-activities', isValidUser, getLoginActivities);
router.post('/cancel-request/:id', isValidUser, cancelCreatorRequest);
router.post('/banned', isValidUser, bannedUser);
router.post('/swap/:userId', swapUserRole);


module.exports = router;
