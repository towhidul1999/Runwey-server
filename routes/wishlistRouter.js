const express = require("express");
const router = express.Router();
const userauthmiddleware=require("../middleWares/auth");

const {wishlistAdd,wishlistGet, wishlistDeleteMany, wishListedVideo, singleWishListedVideo} = require("../controllers/wishlistController");

router.post("/wishlist", userauthmiddleware.isValidUser, wishlistAdd);
router.get("/wishlist", userauthmiddleware.isValidUser, wishlistGet);
router.post("/wishlists", userauthmiddleware.isValidUser, wishlistDeleteMany);
router.get("/wishlisted-video", userauthmiddleware.isValidUser, wishListedVideo);
router.get("/wishlisted-video/:id", userauthmiddleware.isValidUser, singleWishListedVideo);
// router.get("/banner",bannerDataGet);
// router.delete("/banner/:id",userauthmiddleware.isValidUser,bannerDelete);






module.exports = router