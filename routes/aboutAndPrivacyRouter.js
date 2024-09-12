const express = require("express");
const { aboutUs, aboutUsFetch, privacy, privacyFetch, termAndCondition, termAndConditionFetch } = require("../controllers/aboutAndPrivacyController");
const userauthmiddleware=require("../middleWares/auth");
const router = express.Router();



router.post("/aboutus",userauthmiddleware.isValidUser,aboutUs);
router.get("/aboutus",userauthmiddleware.isValidUser,aboutUsFetch);


router.post("/privacy",userauthmiddleware.isValidUser,privacy);
router.get("/privacy",userauthmiddleware.isValidUser,privacyFetch);

router.post("/termCondition",userauthmiddleware.isValidUser,termAndCondition);
router.get("/termCondition",userauthmiddleware.isValidUser,termAndConditionFetch);


module.exports = router