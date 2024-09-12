const express = require('express');
const { uploadVideo, getVideoAsBuffer, getNewestVideos, getPopularContent, searchByTitle, searchByCategory, filterByGender, searchByCategoryProduct, getVideoAllAsBuffer, getAllvideo, myContent, similarContent, getVideoDetails, getContentsByCreator, updateContent, deleteContent, calculate, getAllVideos, getNotifiactions, getNotifications, occassionalContent, showOwnContent, getVideoAsBufferWithName, linkClickCount } = require('../controllers/contentCotroller');

const router = express.Router();

const userFileUploadMiddleware = require("../middleWares/contentUpload");
const { isValidUser } = require('../middleWares/auth');

const UPLOADS_FOLDER_USERS = "./public/content";
const uploadContent = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

/* route listing. */
router.post('/upload', [uploadContent], isValidUser, uploadVideo);
router.put('/:videoId', [uploadContent], isValidUser, updateContent);
router.get('/videos/:id', getVideoAsBuffer);
router.get('/buf/:videoName', getVideoAsBufferWithName);
router.get('/videos', getAllVideos);
// router.get('/newest-videos/:videoId', getNewestVideos);
router.get('/newest-videos', isValidUser, getNewestVideos);
router.get('/popular-content', isValidUser, getPopularContent);
router.get('/search-title/:title', searchByTitle);
router.get('/search-category/:name', searchByCategory);
router.get('/search-category-product/:category', searchByCategoryProduct);
router.get('/filter-gender/:gender', filterByGender);
router.get('/my-content', isValidUser, myContent);
router.get('/similar/:videoId', isValidUser, similarContent);
router.get('/video-details/:videoId', isValidUser, getVideoDetails);
router.get('/contents-by-creator/:creatorId', getContentsByCreator);
router.delete('/delete-content/:videoId', isValidUser, deleteContent);
router.get('/calculate', isValidUser, calculate);
router.get('/notification', isValidUser, getNotifications);
router.get('/category-wise-video/:categoryId', occassionalContent);
router.get('/show-own-content/:videoId/:userId', showOwnContent);
router.post('/link-click/:linkId', linkClickCount);

module.exports = router;