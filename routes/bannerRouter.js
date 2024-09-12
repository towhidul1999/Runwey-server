const express = require("express");
const router = express.Router();
const userauthmiddleware=require("../middleWares/auth");
const configureFileUpload=require("../middleWares/fileUpload");
const { banner, bannerDataGet, bannerDelete } = require("../controllers/bannerController");
const UPLOADS_FOLDER_USERS = "../public/banners";
const uploadContent = configureFileUpload(UPLOADS_FOLDER_USERS); // Corrected function name

router.post("/banner",userauthmiddleware.isValidUser,[uploadContent],banner);
router.get("/banner",bannerDataGet);
router.delete("/banner/:id",userauthmiddleware.isValidUser,bannerDelete);






module.exports = router;