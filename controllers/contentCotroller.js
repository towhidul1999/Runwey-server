const multer = require('multer');
const response = require("../helpers/response");
const Video = require('../models/Content');
const category = require('../models/category');
const User = require('../models/User');
const LikedList = require('../models/likedList');
const { getVideoDurationInSeconds } = require('get-video-duration');
const fs = require('fs');
const AWS = require('aws-sdk');
// const fs = require('fs').promises; // Import the 'promises' version of fs
const path = require('path');
const createError = require('http-errors');
const Rating = require('../models/Rating');
const Payment = require('../models/Payment');
const { filter } = require('lodash');
const Notifications = require('../models/Notification');
const Notification = require('../models/Notification');
const wishlistModel = require('../models/wishlistSchema');
const Link = require('../models/Link');

const uploadDir = path.join(__dirname, '../public/content');
const uploadDirImage = path.join(__dirname, '../public/images');
console.log(uploadDir);
console.log(uploadDirImage);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
};

// const uploadVideo = async (req, res) => {
//   try {
//     const validCategory = await category.findOne({ name: req.body.category });
//     // const validCategory = await category.findOne({ name: req.body.category });
//     console.log(validCategory);
//     if (!validCategory) {
//       return res.status(404).json(response({ message: 'Category is not valid', type: "categories", status: "OK", statusCode: 200 }));
//     }

//     const checkCreator = await User.findOne({ _id: req.body.userId });

//     if (checkCreator.role === 'creator') {
//       const videoPath = path.join(uploadDir, req.files['videoData'][0].filename);

//       // Use getVideoDurationInSeconds to get the video duration
//       const videoDuration = await getVideoDurationInSeconds(videoPath);

//       const video = new Video({
//         title: req.body.title,
//         contentType: req.files['videoData'][0].mimetype,
//         size: req.body.size,
//         countryName: req.body.countryName,
//         fabric: req.body.fabric,
//         material: req.body.material,
//         care: req.body.care,
//         occassionCategory: validCategory.name,
//         gender: req.body.gender,
//         description: req.body.description,
//         userId: req.body.userId,
//         video: `${req.files['videoData'][0].filename}`,
//         videoPath: `${req.protocol}://${req.get('host')}/content/${req.files['videoData'][0].filename}`, // Save video to public/content folder
//         tiktok: req.body.tiktok,
//         instragram: req.body.instragram,
//         duration: videoDuration,
//       });

//       // Check if thumbnail is present in the request before including it
//       if (req.files['thumbnail'] && req.files['thumbnail'][0]) {
//         const thumbnailPath = path.join(uploadDirImage, req.files['thumbnail'][0].filename);
//         video.thumbnail = `/content/${req.files['thumbnail'][0].filename}`;
//         video.thumbnailPath = `${req.protocol}://${req.get('host')}/content/${req.files['thumbnail'][0].filename}`;
//       }

//       const savedVideo = await video.save();

//       const Notification = new Notifications({
//         message: checkCreator.fullName + " has uploaded a new video titled " + savedVideo.title,
//         linkId: savedVideo._id,
//         image: checkCreator.image && checkCreator.image[0] ? checkCreator.image[0].publicFileUrl : null,
//         type: "video",
//         role: "admin"
//       });

//       await Notification.save();

//       io.emit('admin-notification', { message: "New notification arrived" });

//       return res.status(201).json(response({ message: 'Content uploaded successfully', type: 'Content', data: savedVideo, status: "OK", statusCode: 200 }));

//     };

//     return res.status(401).json(response({ message: 'You are not authorized to upload content', type: 'Content', status: "OK", statusCode: 200 }));

//   } catch (error) {
//     console.error(error.message);

//     if (error.name === 'ValidationError') {
//       const validationErrors = {};
//       for (const field in error.errors) {
//         validationErrors[field] = error.errors[field].message;
//       }
//       return res.status(400).json(response({ message: 'Validation failed', errors: validationErrors, status: 'ERROR', statusCode: 400 }));
//     }

//     // Log the error details for debugging purposes
//     console.error("Internal Server Error:", error);

//     // Provide a generic error response
//     res.status(500).json(response({ message: 'Internal Server Error', status: 'ERROR', statusCode: 500 }));
//   }
// };

// single serach 

const uploadToSpaces = async (filePath, fileName) => {
  try {
    const s3 = new AWS.S3({
      endpoint: process.env.DO_SPACE_ENDPOINT,
      accessKeyId: process.env.DO_SPACE_KEY,
      secretAccessKey: process.env.DO_SPACE_SECRET,
    });

    const params = {
      Bucket: process.env.DO_SPACE_BUCKET,
      Key: fileName,
      Body: fs.createReadStream(filePath),
      ACL: 'public-read',
    };

    const uploadResult = await s3.upload(params).promise();

    // Construct CDN link using the DigitalOcean Spaces bucket URL and file name
    const cdnLink = `https://${process.env.DO_SPACE_BUCKET}.${process.env.DO_SPACE_REGION}.cdn.digitaloceanspaces.com/${fileName}`;

    return cdnLink; // Return the CDN link
  } catch (error) {
    throw error;
  }
};

const uploadVideo = async (req, res) => {
  try {
    const validCategory = await category.findOne({ name: req.body.category });
    if (!validCategory) {
      return res.status(404).json(response({ message: 'Category is not valid', type: "categories", status: "OK", statusCode: 200 }));
    }

    const checkCreator = await User.findOne({ _id: req.body.userId });
    console.log(checkCreator.role);

    if (checkCreator.role === 'creator') {
      const videoPath = req.files['videoData'][0].path;

      // Upload video to DigitalOcean Spaces
      const videoUrl = await uploadToSpaces(videoPath, req.files['videoData'][0].filename);

      // Use getVideoDurationInSeconds to get the video duration
      const videoDuration = await getVideoDurationInSeconds(videoPath);

      const video = new Video({
        title: req.body.title,
        contentType: req.files['videoData'][0].mimetype,
        size: req.body.size,
        countryName: req.body.countryName,
        fabric: req.body.fabric,
        material: req.body.material,
        care: req.body.care,
        occassionCategory: validCategory.name,
        gender: req.body.gender,
        description: req.body.description,
        userId: req.body.userId,
        video: req.files['videoData'][0].filename,
        videoPath: videoUrl, // Save CDN endpoint to database
        tiktok: req.body.tiktok,
        instragram: req.body.instragram,
        duration: videoDuration,
      });

      // Check if thumbnail is present in the request before including it
      if (req.files['thumbnail'] && req.files['thumbnail'][0]) {
        const thumbnailPath = req.files['thumbnail'][0].path;

        // Upload thumbnail to DigitalOcean Spaces
        const thumbnailUrl = await uploadToSpaces(thumbnailPath, req.files['thumbnail'][0].filename);

        video.thumbnail = req.files['thumbnail'][0].filename;
        video.thumbnailPath = thumbnailUrl; // Save thumbnail CDN endpoint to database
      }

      const savedVideo = await video.save();

      // Extract key-value pairs from the request body
      const dynamicFields = req.body.dynamicFields;
      console.log(dynamicFields);

      // Validate if dynamicFields is an array
      if (!Array.isArray(dynamicFields)) {
        return res.status(400).json({ error: 'Invalid input format' });
      }

      // Create a new user with dynamic fields
      const newLink = new Link({
        dynamicFields: dynamicFields,
        videoId: savedVideo._id,
      });

      // Save the user to the database
      const savedLink = await newLink.save();

      const Notification = new Notifications({
        message: checkCreator.fullName + " has uploaded a new video titled " + savedVideo.title,
        linkId: savedVideo._id,
        image: checkCreator.image && checkCreator.image[0] ? checkCreator.image[0].publicFileUrl : null,
        type: "video",
        role: "admin"
      });

      await Notification.save();

      io.emit('admin-notification', { message: "New notification arrived" });

      return res.status(201).json(response({ message: 'Content uploaded successfully', type: 'Content', data: savedVideo, status: "OK", statusCode: 200 }));
    }

    return res.status(401).json(response({ message: 'You are not authorized to upload content', type: 'Content', status: "OK", statusCode: 200 }));

  } catch (error) {
    console.error(error.message);
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      return res.status(400).json(response({ message: 'Validation failed', errors: validationErrors, status: 'ERROR', statusCode: 400 }));
    }
    console.error("Internal Server Error:", error.message);
    res.status(500).json(response({ message: error.message, status: 'ERROR', statusCode: 500 }));
  }
};

const getVideoAsBuffer = async (req, res, next) => {
  try {
    const videoRecord = await Video.findById(req.params.id).sort({ createdAt: -1 });
    console.log('videoRecord', videoRecord);

    // await ContentDetails.updateOne({ videoId }, { $inc: { viewCount: 1 } });

    if (!videoRecord) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, staus: "Not found" }));
    }

    // Increment popularity count by 1
    videoRecord.popularity = (videoRecord.popularity || 0) + 1;

    // Save the updated popularity count to the database
    await videoRecord.save();

    const videoFilePath = path.join(__dirname, `../public/content/${videoRecord.video}`);
    console.log(__dirname);

    const range = req.headers.range;
    if (!range) {
      return res.status(400).json({ message: "Require range headers" });
    }

    const videoSize = fs.statSync(videoFilePath).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start} - ${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Type": "video/mp4",
      "Content-Length": contentLength,
    };

    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoFilePath, { start, end });

    // Handle read stream errors
    videoStream.on('error', (err) => {
      console.error(`Error reading video file: ${err.message}`);
      res.status(500).json({ message: "Internel server Error", statusCode: 500, status: "Error" });
    });

    videoStream.pipe(res);
  } catch (error) {
    console.error("GET VIDEO", error.message);
    // Handle any errors that may occur during file reading or response sending
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

// // single serach 
// const getVideoAsBufferWithName = async (req, res, next) => {
//   try {
//     const videoRecord = await Video.find({ video: req.params.videoName}).sort({ createdAt: -1 });
//     console.log('videoRecord', videoRecord);

//     // await ContentDetails.updateOne({ videoId }, { $inc: { viewCount: 1 } });

//     if (!videoRecord) {
//       return res.status(404).json(response({ message: "Video not found", statusCode: 404, staus: "Not found" }));
//     }

//     // Increment popularity count by 1
//     videoRecord.popularity = (videoRecord.popularity || 0) + 1;

//     // Save the updated popularity count to the database
//     // await videoRecord.save();

//     const videoFilePath = path.join(__dirname, `../public/content/${videoRecord.video}`);
//     console.log(__dirname);

//     const range = req.headers.range;
//     if (!range) {
//       return res.status(400).json({ message: "Require range headers" });
//     }

//     const videoSize = fs.statSync(videoFilePath).size;
//     const CHUNK_SIZE = 10 ** 6; // 1MB
//     const start = Number(range.replace(/\D/g, ""));
//     const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
//     const contentLength = end - start + 1;

//     const headers = {
//       "Content-Range": `bytes ${start} - ${end}/${videoSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Type": "video/mp4",
//       "Content-Length": contentLength,
//     };

//     res.writeHead(206, headers);
//     const videoStream = fs.createReadStream(videoFilePath, { start, end });

//     // Handle read stream errors
//     videoStream.on('error', (err) => {
//       console.error(`Error reading video file: ${err.message}`);
//       res.status(500).json({ message: "Internel server Error", statusCode: 500, status: "Error" });
//     });

//     videoStream.pipe(res);
//   } catch (error) {
//     console.error("GET VIDEO", error.message);
//     // Handle any errors that may occur during file reading or response sending
//     next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
//   }
// };

const getVideoAsBufferWithName = async (req, res, next) => {
  try {
    const videoRecord = await Video.findOne({ video: req.params.videoName }).sort({ createdAt: -1 });
    console.log('req.params.videoName', req.params.videoName);
    console.log('videoRecord---------------->>>>>>', videoRecord);

    if (!videoRecord) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
    }

    // Increment popularity count by 1
    videoRecord.popularity = (videoRecord.popularity || 0) + 1;

    // Save the updated popularity count to the database
    // await videoRecord.save();

    const videoFilePath = path.join(__dirname, `../public/content/${videoRecord.video}`);
    console.log(__dirname);

    let range = req.headers.range;
    if (!range) {
      // If range header is not present, set a default range
      range = 'bytes=0-';
    }

    const videoSize = fs.statSync(videoFilePath).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;

    const headers = {
      "Content-Range": `bytes ${start} - ${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Type": "video/mp4",
      "Content-Length": contentLength,
    };

    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoFilePath, { start, end });

    // Handle read stream errors
    videoStream.on('error', (err) => {
      console.error(`Error reading video file: ${err.message}`);
      res.status(500).json({ message: "Internal server Error", statusCode: 500, status: "Error" });
    });

    videoStream.pipe(res);
  } catch (error) {
    console.error("GET VIDEO", error.message);
    // Handle any errors that may occur during file reading or response sending
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

//Multiple search
// const getAllVideos = async (req, res) => {
//   try {
//     // Extract query parameters
//     const search = req.query.search || '';
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const searchRegExp = new RegExp('.*' + search + '.*', 'i');

//     const filter = {
//       $or: [
//         { size: { $regex: searchRegExp } },
//         { occassionCategory: { $regex: searchRegExp } },
//         { material: { $regex: searchRegExp } },
//         { gender: { $regex: searchRegExp } },
//         { title: { $regex: searchRegExp } },
//       ],
//     };

//     const contents = await Video.find(filter).limit(limit).skip((page - 1) * limit);
//     const count = await Video.find(filter).countDocuments();

//     return res.status(200).json({
//       message: "All videos retrieved successfully",
//       type: "All videos",
//       statusCode: 200,
//       status: "OK",
//       data: contents,
//       pagination: {
//         totalItems: count,
//         totalPage: Math.ceil(count / limit),
//         currentPage: page,
//         limit,
//         nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
//         prevPage: page - 1 >= 1 ? page - 1 : null,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error retrieving matching videos', error: error.message });
//   }
// };


// const getAllVideos = async (req, res) => {
//   try {
//     // Extract query parameters
//     const search = req.query.search || [];
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     const filter = {
//       $or: search.map(term => ({
//         $or: [
//           { size: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//           { occassionCategory: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//           { material: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//           { gender: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//           { title: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//         ]
//       }))
//     };

//     const contents = await Video.find(filter).limit(limit).skip((page - 1) * limit);
//     const count = await Video.find(filter).countDocuments();

//     return res.status(200).json({
//       message: "All videos retrieved successfully",
//       type: "All videos",
//       statusCode: 200,
//       status: "OK",
//       data: contents,
//       pagination: {
//         totalItems: count,
//         totalPage: Math.ceil(count / limit),
//         currentPage: page,
//         limit,
//         nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
//         prevPage: page - 1 >= 1 ? page - 1 : null,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error retrieving matching videos', error: error.message });
//   }
// };

//single and multiple search
// const getAllVideos = async (req, res) => {
//   try {
//     // Extract query parameters
//     let search = req.query.search || '';
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     let filter = {};

//     if (Array.isArray(search)) {
//       // Handle multiple search terms
//       filter = {
//         $or: search.map(term => ({
//           $or: [
//             { size: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//             { occassionCategory: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//             { material: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//             { gender: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//             { title: { $regex: new RegExp('.*' + term + '.*', 'i') } },
//           ]
//         }))
//       };
//     } else {
//       // Handle single search term
//       const searchRegExp = new RegExp('.*' + search + '.*', 'i');
//       filter = {
//         $or: [
//           { size: { $regex: searchRegExp } },
//           { occassionCategory: { $regex: searchRegExp } },
//           { material: { $regex: searchRegExp } },
//           { gender: { $regex: searchRegExp } },
//           { title: { $regex: searchRegExp } },
//         ],
//       };
//     }

//     const contents = await Video.find(filter).limit(limit).skip((page - 1) * limit);
//     const count = await Video.find(filter).countDocuments();

//     return res.status(200).json({
//       message: "All videos retrieved successfully",
//       type: "All videos",
//       statusCode: 200,
//       status: "OK",
//       data: contents,
//       pagination: {
//         totalItems: count,
//         totalPage: Math.ceil(count / limit),
//         currentPage: page,
//         limit,
//         nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
//         prevPage: page - 1 >= 1 ? page - 1 : null,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error retrieving matching videos', error: error.message });
//   }
// };

const getAllVideos = async (req, res) => {
  try {
    // Extract query parameters
    let title = req.query.title.trim().toLowerCase() || '';
    let occassionCategory = req.query.occassionCategory.trim().toLowerCase() || '';
    let size = req.query.size.trim().toLowerCase() || '';
    let material = req.query.material.trim().toLowerCase() || '';
    let gender = req.query.gender.trim().toLowerCase() || '';
    let popular = req.query.popular.trim().toLowerCase() || '';

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    let filter = {};

    if (title && title !== 'all') {
      filter.title = { $regex: new RegExp(`${title}`, "i") };
    }

    if (occassionCategory && occassionCategory !== 'all') {
      filter.occassionCategory = { $regex: new RegExp(`${occassionCategory}`, "i") };
    }

    if (size && size !== 'all') {
      filter.size = { $regex: new RegExp(`${size}`, "i") };
    }

    if (material && material !== 'all') {
      filter.material = { $regex: new RegExp(`${material}`, "i") };
    }

    if (gender && gender !== 'all') {
      filter.gender = { $regex: new RegExp(`${gender}`, "i") };
    }

    if (popular && popular !== 'all') {
      filter.popular = { $regex: new RegExp(`${popular}`, "i") };
    }

    const contents = await Video.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("userId", "fullName image");

    const count = await Video.find(filter).sort({ createdAt: -1 }).countDocuments();

    return res.status(200).json({
      message: "All videos retrieved successfully",
      type: "All videos",
      statusCode: 200,
      status: "OK",
      data: contents,
      pagination: {
        totalItems: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        limit,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
        prevPage: page - 1 >= 1 ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving matching videos', error: error.message });
  }
};

// const getNewestVideos = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Extract filter parameters from the query
//     const { occassionCategory, size, title, material, gender } = req.query;

//     // Build the filter based on the provided query parameters
//     const filter = {};

//     if (occassionCategory && occassionCategory !== "All" && occassionCategory !== " ") {
//       filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
//     }

//     if (size && size !== "All") {
//       filter.size = { $regex: size, $options: 'i' };
//     }

//     if (title && size !== "All") {
//       filter.title = { $regex: title, $options: 'i' };
//     }

//     if (material && material !== "All") {
//       filter.material = { $regex: material, $options: 'i' };
//     }

//     if (gender && gender !== "All") {
//       filter.gender = { $regex: gender, $options: 'i' };
//     }

//     // Check if videoId is provided in params
//     const { videoId } = req.params;
//     let specificVideo = null;

//     if (videoId) {
//       specificVideo = await Video.findById(videoId).populate("userId", "fullName image");
//     }

//     const newestVideos = await Video.find(filter)
//       .sort({ createdAt: -1 })
//       .limit(limit)
//       .skip(skip)
//       .populate("userId", "fullName image");

//     // If a specific video is provided, include it in the results
//     if (specificVideo) {
//       newestVideos.unshift(specificVideo);
//     }

//     const totalItems = await Video.countDocuments(filter);
//     const totalPages = Math.ceil(totalItems / limit);

//     res.json(response({
//       message: 'Newest videos retrieved successfully',
//       type: 'get newest videos',
//       status: 'OK',
//       statusCode: 200,
//       data: {
//         newestVideos,
//         pagination: {
//           totalItems,
//           totalPages,
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     console.error(error.message);
//     next(createError(response({ statusCode: 500, message: 'Internal server error', status: 'Failed' })));
//   }
// };

// const getNewestVideos = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = req.query.limit || 10;
//     const skip = (page - 1) * limit;

//     // Extract filters from request query parameters
//     const { occassionCategory, size, title, materials } = req.query;

//     // Build the filter object based on provided criteria
//     const filter = {};
//     if (occassionCategory && occassionCategory !== "All" && occassionCategory !== " ") {
//       filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
//     }
//     if (size && size !== "All" && size !== " ") {
//       filter.size = { $regex: size, $options: 'i' };
//     }
//     if (title && title !== "All" && title !== " ") {
//       filter.title = { $regex: title, $options: 'i' };
//     }
//     if (materials && materials !== "All" && materials !== " ") {
//       filter.materials = { $regex: materials, $options: 'i' };
//     }

//     // Find newest videos based on filters
//     const newestVideos = await Video.find({ ...filter })
//       .populate('userId', 'fullName image')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: newestVideos.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     const newestVideosWithIsLiked = newestVideos.map(video => {
//       video = video.toObject(); // Convert to plain JavaScript object
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//       return video;
//     });

//     const totalItems = await Video.countDocuments({ ...filter });

//     res.json(response({
//       message: 'Newest videos retrieved successfully',
//       status: "OK",
//       statusCode: 200,
//       data: {
//         // attributes: {
//           newestVideos: newestVideosWithIsLiked,
//           pagination: {
//             totalItems,
//             totalPages: Math.ceil(totalItems / limit),
//             currentPage: page,
//             limit,
//           // },
//         },
//       },
//     }));
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json(response({ statusCode: 500, message: 'Internal server error', status: "Failed" }));
//   }
// };

// const getPopularContent = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = req.query.limit || 10;
//     const skip = (page - 1) * limit;

//     // Extract filters from request query parameters
//     const { occasionCategory, size, title, materials } = req.query;

//     // Build the filter object based on provided criteria
//     const filter = {};
//     if (occasionCategory && occasionCategory !== "All" && occasionCategory !== " ") {
//       filter.$and = filter.$and || [];
//       filter.$and.push({ occasionCategory: occasionCategory })
//     }
//     if (size && size !== "All" && size !== " ") {
//       filter.$and = filter.$and || [];
//       filter.$and.push({ size: size })
//     }
//     if (title && size !== "All" && size !== " ") {
//       filter.$and = filter.$and || [];
//       filter.$and.push({ title: { $regex: new RegExp(title, "i") } })
//     }
//     if (materials && materials !== "All" && size !== " ") {
//       filter.$and = filter.$and || [];
//       filter.$and.push({ materials: materials })
//     }

//     // Find popular content based on filters
//     const popularContent = await Video.find({ ...filter })
//       .sort({ popularity: -1 })
//       .limit(limit)
//       .skip(skip)
//       .populate("userId", "fullName image");

//     // Get total count for pagination
//     const allItems = await Video.countDocuments({ ...filter });
//     const totalPages = Math.ceil(allItems / limit);

//     // Return the filtered popular content
//     res.json(response({
//       message: 'Popular content retrieved successfully',
//       type: "get popular content",
//       status: "OK",
//       statusCode: 200,
//       data: {
//         popularContent,
//         pagination: {
//           totalItems: allItems,
//           totalPages,
//           currentPage: page,
//           limit
//         },
//       }
//     }));
//   } catch (error) {
//     console.error(error.message);
//     next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
//   }
// };

// const getPopularContent = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     // Extract filters from request query parameters
//     const { occasionCategory, size, title, materials } = req.query;

//     // Build the filter object based on provided criteria
//     const filter = {};

//     if (occasionCategory && occasionCategory !== "All" && occasionCategory !== " ") {
//       filter.occassionCategory = { $regex: new RegExp(occasionCategory, "i") };
//     }

//     if (size && size !== "All" && size !== " ") {
//       filter.size = { $regex: new RegExp(size, "i") };
//     }

//     if (title && title !== "All" && title !== " ") {
//       filter.title = { $regex: new RegExp(title, "i") };
//     }

//     if (materials && materials !== "All" && materials !== " ") {
//       filter.materials = { $regex: new RegExp(materials, "i") };
//     }

//     // Find popular content based on filters
//     const popularContent = await Video.aggregate([
//       {
//         $match: filter
//       },
//       {
//         $sort: {
//           occassionCategory: -1, // Sort by occassionCategory in descending order
//           popularity: -1 // Then, sort by popularity in descending order
//         }
//       },
//       {
//         $skip: skip
//       },
//       {
//         $limit: limit
//       },
//     ]);

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: popularContent.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     popularContent.forEach(video => {
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//     });

//     await Video.populate(popularContent, {
//       path: "userId",
//       select: "fullName image",
//     });

//     // Get total count for pagination
//     const allItems = await Video.countDocuments(filter);
//     const totalPages = Math.ceil(allItems / limit);

//     // Return the filtered popular content
//     res.json(response({
//       message: 'Popular content retrieved successfully',
//       type: "get popular content",
//       status: "OK",
//       statusCode: 200,
//       data: {
//         popularContent,
//         pagination: {
//           totalItems: allItems,
//           totalPages,
//           currentPage: page,
//           limit
//         },
//       }
//     }));
//   } catch (error) {
//     console.error(error.message);
//     next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
//   }
// };

// const getNewestVideos = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = req.query.limit || 10;
//     const skip = (page - 1) * limit;

//     // Extract filters from request query parameters
//     const { occassionCategory, size, title, materials, gender } = req.query;

//     // Build the filter object based on provided criteria
//     const filter = {};
//     if (occassionCategory && occassionCategory !== "All" && occassionCategory !== " ") {
//       filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
//     }
//     if (size && size !== "All" && size !== " ") {
//       filter.size = { $regex: size, $options: 'i' };
//     }
//     if (title && title !== "All" && title !== " ") {
//       filter.title = { $regex: title, $options: 'i' };
//     }
//     if (materials && materials !== "All" && materials !== " ") {
//       filter.materials = { $regex: materials, $options: 'i' };
//     }
//     if (gender && gender !== "All" && gender !== " ") {
//       filter.gender = { $regex: gender, $options: 'i' };
//     }

//     // Find newest videos based on filters
//     const newestVideos = await Video.find({ ...filter })
//       .populate('userId', 'fullName image')
//       .sort({ gender: -1, createdAt: -1 }) // Sort by gender in descending order, then by createdAt
//       .skip(skip)
//       .limit(limit);

//     // Filter out videos of the opposite gender
//     const filteredVideos = newestVideos.filter(video => video.gender.toLowerCase() === gender.toLowerCase());

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: filteredVideos.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     const newestVideosWithIsLiked = filteredVideos.map(video => {
//       video = video.toObject(); // Convert to plain JavaScript object
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//       return video;
//     });

//     const totalItems = filteredVideos.length; // Use the count of filtered videos

//     res.json(response({
//       message: 'Newest videos retrieved successfully',
//       status: "OK",
//       statusCode: 200,
//       data: {
//         newestVideos: newestVideosWithIsLiked,
//         pagination: {
//           totalItems,
//           totalPages: Math.ceil(totalItems / limit),
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json(response({ statusCode: 500, message: 'Internal server error', status: "Failed" }));
//   }
// };

// const getPopularContent = async (req, res, next) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = req.query.limit || 10;
//     const skip = (page - 1) * limit;

//     // Extract filters from request query parameters
//     const { occassionCategory, size, title, materials } = req.query;

//     // Build the filter object based on provided criteria
//     const filter = {};
//     if (occassionCategory && occassionCategory !== "All" && occassionCategory !== " ") {
//       filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
//     }
//     if (size && size !== "All" && size !== " ") {
//       filter.size = { $regex: size, $options: 'i' };
//     }
//     if (title && title !== "All" && title !== " ") {
//       filter.title = { $regex: title, $options: 'i' };
//     }
//     if (materials && materials !== "All" && materials !== " ") {
//       filter.materials = { $regex: materials, $options: 'i' };
//     }

//     // Find popular content based on filters
//     const popularContent = await Video.find({ ...filter })
//       .populate('userId', 'fullName image')
//       .sort({ popularity: -1 })
//       .skip(skip)
//       .limit(limit);

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: popularContent.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     const popularContentWithIsLiked = popularContent.map(video => {
//       video = video.toObject(); // Convert to plain JavaScript object
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//       return video;
//     });

//     const totalItems = await Video.countDocuments({ ...filter });

//     res.json(response({
//       message: 'Popular content retrieved successfully',
//       type: "get popular content",
//       status: "OK",
//       statusCode: 200,
//       data: {
//         popularContent: popularContentWithIsLiked,
//         pagination: {
//           totalItems,
//           totalPages: Math.ceil(totalItems / limit),
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json(response({ statusCode: 500, message: 'Internal server error', status: "Failed" }));
//   }
// };
// const getNewestVideos = async (req, res, next) => {
//   try {
//     const search = req.query.search || "";
//     const title = req.query.title || "";
//     const gender = req.query.gender || "";
//     const material = req.query.material || "";
//     const occassionCategory = req.query.occassionCategory || "";
//     const size = req.query.size || "";

//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const searchRegExp = new RegExp(search, "i");

//     const filter = {};

//     if (title.trim()) {
//       filter.title = { $regex: new RegExp(title, "i") };
//     }

//     if (material.trim()) {
//       filter.material = { $regex: new RegExp(material, "i") };
//     }

//     if (occassionCategory.trim()) {
//       filter.occassionCategory = { $regex: new RegExp(occassionCategory, "i") };
//     }

//     if (size.trim()) {
//       filter.size = { $regex: new RegExp(size, "i") };
//     }

//     if (gender.trim()) {
//       filter.gender = { $regex: new RegExp(gender, "i") };
//     }

//     const videos = await Video.find(filter)
//       .skip((page - 1) * limit)
//       .limit(limit);

//     return res.status(200).json(videos);
//   } catch (error) {
//     console.log(error.message);
//     return res.status(500).json(error);
//   }
// };

const getNewestVideos = async (req, res, next) => {
  try {
    const userId = req.body.userId; // Assuming you have user information available in the request
    console.log(userId);

    const title = req.query.title || "";
    const gender = req.query.gender || "";
    const material = req.query.material || "";
    const occassionCategory = req.query.occassionCategory || "";
    const size = req.query.size || "";

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const filter = {};

    if (title.trim() && title.toLowerCase() !== 'all' && title.toLowerCase() !== " ") {
      filter.title = { $regex: new RegExp(`^${title}$`, "i") };
    }

    if (material.trim() && material.toLowerCase() !== 'all' && material.toLowerCase() !== " ") {
      filter.material = { $regex: new RegExp(`^${material}$`, "i") };
    }

    if (occassionCategory.trim() && occassionCategory.toLowerCase() !== 'all' && occassionCategory.toLowerCase !== " ") {
      filter.occassionCategory = { $regex: new RegExp(`^${occassionCategory}$`, "i") };
    }

    if (size.trim() && size.toLowerCase() !== 'all' && size.toLowerCase() !== " ") {
      filter.size = { $regex: new RegExp(`^${size}$`, "i") };
    }

    if (gender.trim() && gender.toLowerCase() !== "all" && gender.toLowerCase() !== " ") {
      filter.gender = { $regex: new RegExp(`^${gender}$`, "i") };
    }

    const totalItems = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    let videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName image')
      .skip((page - 1) * limit)
      .limit(limit);

    let likedList = await LikedList.find({ userId: userId });
    console.log(likedList);

    videos = videos.map(video => {
      // Check if the videoId exists in the likedList
      const isLiked = likedList.some(liked => liked.videoId.toString() === video._id.toString());
      // Set the isLiked field accordingly
      return {
        ...video.toObject(),
        isLiked
      };
    });




    return res.status(200).json(response({
      message: 'Newest content retrieved successfully',
      type: "Get Newest content",
      status: "OK",
      statusCode: 200,
      data: {
        newestVideos: videos,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          limit,
        },
      },
    }));
  } catch (error) {
    console.log(error.message);
    return res.status(500).json(error);
  }
};

const getPopularContent = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    // Extract filters from request query parameters
    const { occassionCategory, size, title, materials, gender } = req.query;

    // Build the filter object based on provided criteria
    const filter = {};
    if (occassionCategory && occassionCategory.toLowerCase() !== 'all' && occassionCategory.trim() !== "") {
      filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
    }
    if (size && size.toLowerCase() !== 'all' && size.trim() !== "") {
      filter.size = { $regex: size, $options: 'i' };
    }
    if (title && title.toLowerCase() !== 'all' && title.trim() !== "") {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (materials && materials.toLowerCase() !== 'all' && materials.trim() !== "") {
      filter.materials = { $regex: materials, $options: 'i' };
    }
    if (gender && gender.toLowerCase() !== 'all' && gender.trim() !== "") {
      filter.gender = { $regex: `^${gender}$`, $options: 'i' };
    }

    // Find popular content based on filters and popularity
    const popularContent = await Video.find({ ...filter })
      .populate('userId', 'fullName image')
      .sort({ popularity: -1, gender: -1 }) // Sort by popularity in descending order, then by gender
      .skip(skip)
      .limit(limit);

    // Fetch LikedList data for the given user
    const likedList = await LikedList.find({
      videoId: { $in: popularContent.map(video => video._id) },
      userId: req.body.userId,
    });

    const likedVideoIds = likedList.map(item => item.videoId.toString());

    const popularContentWithIsLiked = popularContent.map(video => {
      video = video.toObject(); // Convert to plain JavaScript object
      video.isLiked = likedVideoIds.includes(video._id.toString());
      return video;
    });

    const totalItems = await Video.countDocuments({ ...filter });

    res.json(response({
      message: 'Popular content retrieved successfully',
      type: "get popular content",
      status: "OK",
      statusCode: 200,
      data: {
        popularContent: popularContentWithIsLiked,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          limit,
        },
      },
    }));
  } catch (error) {
    console.error(error.message);
    res.status(500).json(response({ statusCode: 500, message: 'Internal server error', status: "Failed" }));
  }
};

const searchByTitle = async (req, res, next) => {
  try {
    const searchTitle = req.params.title;
    console.log("searchTitle::::", searchTitle);

    const regex = new RegExp(searchTitle, 'i');

    const videos = await Video.find({ title: regex }).sort({ createdAt: -1 });

    if (videos.length === 0) {
      return res.status(404).json(response({ message: "No video found for this title", type: "Content", statusCode: 404, status: "Not Foiund" }));
    }

    res.json(response({ message: 'Videos retrieved successfully', type: "search by title", status: "OK", statusCode: 200, data: videos }));
  } catch (error) {
    console.error(error.message);
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

const searchByCategory = async (req, res, next) => {
  try {
    const searchCategory = req.params.name;

    const regex = new RegExp(searchCategory, 'i');

    const videos = await category.find({ name: regex }).sort({ createdAt: -1 });

    if (videos.length === 0) {
      return res.status(404).json(response({ message: "No videos found with this specified category", statusCode: 404, status: "Not found", type: "Content" }));
    }

    res.json(response({ message: 'Videos retrieved successfully', type: "search by category", status: "OK", statusCode: 200, data: videos }));
  } catch (error) {
    console.error(error.message);
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

const filterByGender = async (req, res, next) => {

  try {
    const genderFilter = req.params.gender;

    if (genderFilter !== 'Male' && genderFilter !== 'Female' && genderFilter !== 'all') {
      return res.status(400).json(response({ message: "Invalid gender filter. Use 'male', 'female', or 'all'.", stausCode: 400, status: "Bad Request", type: "Content" }));
    }

    let filter;
    if (genderFilter !== 'all') {
      // If the filter is 'male' or 'female', perform the search based on the gender
      filter = { gender: genderFilter };
    } else {
      // If the filter is 'all', retrieve all videos without gender filtering
      filter = {};
    }

    // Perform the search in the Video model based on the gender filter
    const videos = await Video.find(filter).sort({ createdAt: -1 });

    // Check if any videos are found
    if (videos.length === 0) {
      return res.status(404).json(response({ message: `No ${genderFilter === 'all' ? 'videos' : `${genderFilter} videos`} found with the specified gender filter`, statusCode: 404, status: "Not Found", type: "Content" }));
    }

    // Return the search results
    res.json(response({ message: 'Videos retrieved successfully', type: "filter by gender", status: "OK", statusCode: 200, data: videos }));
  } catch (error) {
    console.error(error.message);
    // Handle any errors that may occur during database query or response sending
    next(createError(res.status(500).json(response({ statusCode: 500, message: 'Internal server error', status: "Failed", type: "Content" }))));
  }
};

const searchByCategoryProduct = async (req, res, next) => {
  try {
    const searchCategory = req.params.category;

    const regex = new RegExp(searchCategory, 'i');

    const videos = await Video.find({ category: regex }).sort({ createdAt: -1 });

    if (videos.length === 0) {
      return res.status(404).send("No videos found with the specified category");
    }

    res.json(response({ message: 'Videos retrieved successfully', type: "search by category", status: "OK", statusCode: 200, data: videos }));
  } catch (error) {
    console.log(error);
    next(createError(response({ statusCode: 500, message: error, status: "Failed" })));
  }
};

const myContent = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Extract filter parameters from the query
    const { occassionCategory, size, title, material, gender } = req.query;

    // Build the filter based on the provided query parameters
    const filter = {};

    if (occassionCategory && occassionCategory !== "All" && occassionCategory !== " ") {
      filter.occassionCategory = { $regex: occassionCategory, $options: 'i' };
    }

    if (size && size !== "All") {
      filter.size = { $regex: size, $options: 'i' };
    }

    if (title && size !== "All") {
      filter.title = { $regex: title, $options: 'i' };
    }

    if (material && material !== "All") {
      filter.material = { $regex: material, $options: 'i' };
    }

    if (gender && gender !== "All") {
      filter.gender = { $regex: gender, $options: 'i' };
    }

    filter.userId = { $eq: req.body.userId };

    const videos = await Video.find({ ...filter })
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName image");

    // Fetch LikedList data for the given user
    const likedList = await LikedList.find({
      videoId: { $in: videos.map(video => video._id) },
      userId: req.body.userId,
    });

    const likedVideoIds = likedList.map(item => item.videoId.toString());

    const videosWithIsLiked = videos.map(video => ({
      ...video.toObject(),
      isLiked: likedVideoIds.includes(video._id.toString()) || video.userId.toString() === req.body.userId,
    }));

    const count = await Video.countDocuments({ ...filter });
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json(response({
      message: "Videos retrieved successfully",
      statusCode: 200,
      status: "OK",
      data: {
        videos: videosWithIsLiked,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    }));
  } catch (error) {
    console.log(error);
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: 'Failed' })));
  }
};

const showOwnContent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    if (!user) {
      return res.status(404).json(response({ message: "User not found", statusCode: 404, status: "Not found" }));
    }

    // Extract search parameters from request query
    const { title, occasionCategory, size, material, gender } = req.query;

    // Build the query object based on search parameters
    const filter = { userId: user._id };

    if (title && title !== "All" && title !== " ") {
      filter.$and = filter.$and || [];
      filter.$and.push({ title: { $regex: new RegExp(title, "i") } });
    }

    if (occasionCategory && occasionCategory !== "All" && occasionCategory !== " ") {
      filter.$and = filter.$and || [];
      filter.$and.push({ occasionCategory: occasionCategory });
    }

    if (size && size !== "All" && size !== " ") {
      filter.$and = filter.$and || [];
      filter.$and.push({ size: size });
    }

    // Add new conditions for material and gender
    if (material && material !== "All" && material !== " ") {
      filter.$and = filter.$and || [];
      filter.$and.push({ material: { $regex: new RegExp(material, "i") } });
    }

    if (gender && gender !== "All" && gender !== " ") {
      filter.$and = filter.$and || [];
      filter.$and.push({ gender: gender });
    }

    // If videoId is provided, move the user's video to the front
    if (req.params.videoId) {
      const userVideo = await Video.findOne({ _id: req.params.videoId, userId: user._id }).populate("userId", "fullName image");;
      if (userVideo) {
        // Retrieve videos excluding the specified videoId
        const otherVideos = await Video.find({ userId: user._id, _id: { $ne: userVideo._id } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit - 1)
          .populate("userId", "fullName image");

        // Combine the specified video and other videos
        const videos = [userVideo, ...otherVideos];

        const count = await Video.countDocuments({ userId: user._id });
        const totalPages = Math.ceil(count / limit);

        console.log(videos);

        return res.status(200).json(response({
          message: "Videos retrieved successfully",
          statusCode: 200,
          status: "OK",
          data: {
            videos,
            pagination: {
              totalItems: count,
              totalPages,
              currentPage: page,
              limit,
            },
          },
        }));
      }
    }

    // If videoId is not provided, proceed with the regular query
    const videos = await Video.find(filter)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName image");

    const count = await Video.countDocuments(filter);
    const totalPages = Math.ceil(count / limit);

    console.log(videos);

    return res.status(200).json(response({
      message: "Videos retrieved successfully",
      statusCode: 200,
      status: "OK",
      data: {
        videos,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    }));

  } catch (error) {
    return res.status(500).json(response({ message: "Internal server error", statusCode: 500, status: "Failed" }));
  }
};

// const similarContent = async (req, res, next) => {
//   try {
//     const videoId = req.params.videoId;
//     const limit = Number(req.query.limit) || 10;
//     const page = Number(req.query.page) || 1;
//     const video = await Video.findById(videoId);

//     if (!video) {
//       return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
//     }
//     const skip = (page - 1) * limit;

//     const similarVideos = await Video.aggregate([
//       {
//         $match: {
//           occassionCategory: video.occassionCategory,
//           _id: { $ne: videoId },
//         },
//       },
//       {
//         $addFields: {
//           isCurrentVideo: { $eq: ["$_id", video._id] },
//         },
//       },
//       {
//         $sort: {
//           isCurrentVideo: -1,
//         },
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limit,
//       },
//       {
//         $lookup: {
//           from: "likedList", // Replace with the actual name of your likedList collection
//           let: { videoId: "$_id" },
//           pipeline: [
//             {
//               $match: {
//                 $expr: {
//                   $and: [
//                     { $eq: ["$videoId", "$$videoId"] },
//                     { $eq: ["$userId", req.body.userId] },
//                   ],
//                 },
//               },
//             },
//           ],
//           as: "isLiked",
//         },
//       },
//       {
//         $addFields: {
//           isLiked: { $cond: { if: { $gt: [{ $size: "$isLiked" }, 0] }, then: true, else: false } },
//         },
//       },
//     ]);

//     await Video.populate(similarVideos, {
//       path: "userId",
//       select: "fullName image"
//     });


//     // Count total number of similar videos without pagination
//     const totalSimilarVideosCount = await Video.countDocuments({
//       occassionCategory: video.occassionCategory,
//       _id: { $ne: videoId },
//     });

//     const totalPages = Math.ceil(totalSimilarVideosCount / limit);

//     return res.status(200).json(response({
//       message: "Similar videos retrieved successfully",
//       statusCode: 200,
//       status: "OK",
//       data: {
//         similarVideos,
//         pagination: {
//           totalItems: totalSimilarVideosCount,
//           totalPages,
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//   }
// };

// const similarContent = async (req, res, next) => {
//   try {
//     const videoId = req.params.videoId;
//     const limit = Number(req.query.limit) || 10;
//     const page = Number(req.query.page) || 1;
//     const video = await Video.findById(videoId);

//     if (!video) {
//       return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
//     }
//     const skip = (page - 1) * limit;

//     const similarVideos = await Video.aggregate([
//       {
//         $match: {
//           occassionCategory: video.occassionCategory,
//           _id: { $ne: videoId },
//         },
//       },
//       {
//         $addFields: {
//           isCurrentVideo: { $eq: ["$_id", video._id] },
//         },
//       },
//       {
//         $sort: {
//           isCurrentVideo: -1,
//         },
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limit,
//       },
//     ]);

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: similarVideos.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     similarVideos.forEach(video => {
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//     });

//     await Video.populate(similarVideos, {
//       path: "userId",
//       select: "fullName image"
//     });

//     // Count total number of similar videos without pagination
//     const totalSimilarVideosCount = await Video.countDocuments({
//       occassionCategory: video.occassionCategory,
//       _id: { $ne: videoId },
//     });

//     const totalPages = Math.ceil(totalSimilarVideosCount / limit);

//     return res.status(200).json(response({
//       message: "Similar videos retrieved successfully",
//       statusCode: 200,
//       status: "OK",
//       data: {
//         similarVideos,
//         pagination: {
//           totalItems: totalSimilarVideosCount,
//           totalPages,
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//   }
// };

// const similarContent = async (req, res, next) => {
//   try {
//     const videoId = req.params.videoId;
//     const limit = Number(req.query.limit) || 10;
//     const page = Number(req.query.page) || 1;
//     const video = await Video.findById(videoId);

//     if (!video) {
//       return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
//     }
//     const skip = (page - 1) * limit;

//     const similarVideos = await Video.aggregate([
//       {
//         $addFields: {
//           isCurrentVideo: { $eq: ["$_id", video._id] },
//         },
//       },
//       {
//         $sort: {
//           isCurrentVideo: -1,
//         },
//       },
//       {
//         $skip: skip,
//       },
//       {
//         $limit: limit,
//       },
//     ]);

//     // Fetch LikedList data for the given user
//     const likedList = await LikedList.find({
//       videoId: { $in: similarVideos.map(video => video._id) },
//       userId: req.body.userId,
//     });

//     const likedVideoIds = likedList.map(item => item.videoId.toString());

//     similarVideos.forEach(video => {
//       video.isLiked = likedVideoIds.includes(video._id.toString());
//     });

//     await Video.populate(similarVideos, {
//       path: "userId",
//       select: "fullName image",
//     });

//     // Count total number of similar videos without pagination
//     const totalSimilarVideosCount = await Video.countDocuments({
//       _id: { $ne: videoId },
//     });

//     const totalPages = Math.ceil(totalSimilarVideosCount / limit);

//     return res.status(200).json(response({
//       message: "Similar videos retrieved successfully",
//       statusCode: 200,
//       status: "OK",
//       data: {
//         similarVideos,
//         pagination: {
//           totalItems: totalSimilarVideosCount,
//           totalPages,
//           currentPage: page,
//           limit,
//         },
//       },
//     }));
//   } catch (error) {
//     return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//   }
// };

const similarContent = async (req, res, next) => {
  try {
    const videoId = req.params.videoId;
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const video = await Video.findById(videoId);

    console.log(video.occassionCategory);

    if (!video) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
    }
    const skip = (page - 1) * limit;

    const filter = {
      _id: { $ne: videoId }, // Exclude the current video
    };

    // Add additional filters based on request parameters
    if (req.query.gender !== undefined && req.query.gender !== "All" && req.query.gender.trim() !== "") {
      filter.gender = { $regex: new RegExp(`^${req.query.gender}$`, "i") };
    }

    if (req.query.size !== undefined && req.query.size !== "All" && req.query.size.trim() !== "") {
      filter.size = { $regex: new RegExp(`^${req.query.size}$`, "i") };
    }

    if (req.query.material !== undefined && req.query.material !== "All" && req.query.material.trim() !== "") {
      filter.material = { $regex: new RegExp(`^${req.query.material}$`, "i") };
    }

    if (req.query.title !== undefined && req.query.title !== "All" && req.query.title.trim() !== "") {
      filter.title = { $regex: new RegExp(`^${req.query.title}$`, "i") };
    }

    if (req.query.occassionCategory !== undefined && req.query.occassionCategory !== "All" && req.query.occassionCategory.trim() !== "") {
      filter.occassionCategory = { $regex: new RegExp(`^${req.query.occassionCategory}$`, "i") };
    }

    const similarVideos = await Video.aggregate([
      {
        $match: filter,
      },
      {
        $addFields: {
          isCurrentVideo: { $eq: ["$_id", video._id] },
        },
      },
      {
        $sort: {
          isCurrentVideo: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    // Fetch LikedList data for the given user
    const likedList = await LikedList.find({
      videoId: { $in: similarVideos.map(video => video._id) },
      userId: req.body.userId,
    });

    const likedVideoIds = likedList.map(item => item.videoId.toString());

    similarVideos.forEach(video => {
      video.isLiked = likedVideoIds.includes(video._id.toString());
    });

    await Video.populate(similarVideos, {
      path: "userId",
      select: "fullName image",
    });

    // Count total number of similar videos without pagination
    const totalSimilarVideosCount = await Video.countDocuments(filter);

    const totalPages = Math.ceil(totalSimilarVideosCount / limit);

    return res.status(200).json(response({
      message: "Similar videos retrieved successfully",
      statusCode: 200,
      status: "OK",
      data: {
        similarVideos,
        pagination: {
          totalItems: totalSimilarVideosCount,
          totalPages,
          currentPage: page,
          limit,
        },
      },
    }));
  } catch (error) {
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
};

const getVideoDetails = async (req, res, next) => {
  try {
    const videoId = req.params.videoId;
    const limit = Number(req.query.limit) || 1;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    // Fetch the provided video by videoId
    const video = await Video.findById(videoId).populate('userId', 'fullName image');
    if (!video) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
    }

    // Fetch similar videos (including the provided video)
    const similarVideos = await Video.aggregate([
      {
        $match: {
          occassionCategory: video.occassionCategory,
          _id: { $ne: null }, // Exclude any specific video for now
        },
      },
      {
        $addFields: {
          isCurrentVideo: { $eq: ["$_id", video._id] },
        },
      },
      {
        $sort: {
          isCurrentVideo: -1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit + 1, // Fetch one extra to filter out the provided video
      },
    ]);

    // Filter out the provided video from the similar videos list
    const filteredSimilarVideos = similarVideos.filter(vid => vid._id.toString() !== videoId);

    // Count total number of similar videos without pagination
    const totalSimilarVideosCount = await Video.countDocuments({
      occassionCategory: video.occassionCategory,
      _id: { $ne: videoId },
    });

    const totalPages = Math.ceil(totalSimilarVideosCount / limit);

    // Fetch reviews for the provided video
    const reviews = await Rating.find({ videoId: videoId }).populate('userId', 'fullName image').sort({ ratings: -1 }).limit(50);
    const reviewsCount = await Rating.find({ videoId: videoId }).countDocuments();

    // Fetch count of users who added the video to their wishlist
    const wishListCount = await wishlistModel.find({ videoId: videoId }).countDocuments();

    // Fetch links associated with the video
    const links = await Link.findOne({ videoId: videoId });

    // Transform links to match the desired format
    const formattedLinks = links.dynamicFields.map(field => ({ key: field.key, value: field.value, count: field.count, _id: field._id }));

    // Check if the current user has liked the provided video
    const isLiked = await LikedList.findOne({ videoId: videoId, userId: req.body.userId });

    return res.status(200).json(response({
      message: "Details video retrieved successfully",
      statusCode: 200,
      status: "OK",
      data: {
        video: { ...video.toObject(), isLiked: isLiked ? true : false },
        reviews,
        reviewsCount,
        wishListCount,
        links: formattedLinks, // Include the formatted links in the response data
        similarVideos: filteredSimilarVideos,
        pagination: {
          totalItems: totalSimilarVideosCount,
          totalPages,
          currentPage: page,
          limit
        },
      },
    }));
  } catch (error) {
    console.log(error);
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
};

const getContentsByCreator = async (req, res, next) => {
  try {
    const creatorId = req.params.creatorId;
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ userId: creatorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("userId", "fullName image");

    // Fetch LikedList data for the given user
    const likedList = await LikedList.find({
      videoId: { $in: videos.map(video => video._id) },
      userId: req.body.userId,
    });

    const likedVideoIds = likedList.map(item => item.videoId.toString());

    const videosWithIsLiked = videos.map(video => ({
      ...video.toObject(),
      isLiked: likedVideoIds.includes(video._id.toString()) || video.userId.toString() === req.body.userId,
    }));

    const allItems = await Video.countDocuments({ userId: creatorId });
    const totalPages = Math.ceil(allItems / limit);

    return res.status(200).json(response({
      message: "Videos retrieved successfully",
      statusCode: 200,
      status: "OK",
      data: {
        videos: videosWithIsLiked,
        pagination: {
          totalItems: allItems,
          totalPages,
          currentPage: page,
          limit
        },
      },
    }));
  } catch (error) {
    console.log(error);
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
};

const updateContent = async (req, res, next) => {
  try {
    const videoId = req.params.videoId;
    const { title, size, countryName, fabric, material, care, occassionCategory, description, instragram, tiktok } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
    }

    var updatedData = {
      title: !title ? video.title : title,
      size: !size ? video.size : size,
      countryName: !countryName ? video.countryName : countryName,
      fabric: !fabric ? video.fabric : fabric,
      material: !material ? video.material : material,
      care: !care ? video.care : care,
      occassionCategory: !occassionCategory ? video.occassionCategory : occassionCategory,
      description: !description ? video.description : description,
      video: `content/${video.video}`,
      thumbnail: `content/${video.thumbnail}`,
      videoPath: video.videoPath,
      thumbnailPath: video.thumbnailPath,
      instragram: !instragram ? video.instragram : instragram,
      tiktok: !tiktok ? video.tiktok : tiktok,
    }

    if (req.files['videoData'] && req.files['videoData'][0]) {
      updatedData.video = req.files['videoData'][0].filename;
      updatedData.videoPath = `${req.protocol}://${req.get('host')}/content/${req.files['videoData'][0].filename}`;
    }

    if (req.files['thumbnail'] && req.files['thumbnail'][0]) {
      updatedData.thumbnail = req.files['thumbnail'][0].filename;
      updatedData.thumbnailPath = `${req.protocol}://${req.get('host')}/content/${req.files['thumbnail'][0].filename}`;
    }

    const data = await Video.findByIdAndUpdate(videoId, updatedData, { new: true });
    return res.status(200).json(response({ message: "Video updated successfully", statusCode: 200, status: "OK", data: data }));
  } catch (error) {
    console.log(error);
    next(createError(response({ statusCode: 500, message: error, status: "Failed" })));
  }
};

const deleteContent = async (req, res, next) => {
  try {
    const validUser = await User.findById(req.body.userId);
    console.log("------------=====", req.body.userId);
    if (validUser._id.toString() !== req.body.userId) {
      return res.status(404).json(response({ message: "You are not authorized", statusCode: 404, status: "Not found" }));
    }

    const videoId = req.params.videoId;
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json(response({ message: "Video not found", statusCode: 404, status: "Not found" }));
    }

    await Video.findByIdAndDelete(videoId).populate('userId', 'image');
    await wishlistModel.deleteMany({ videoId: videoId });
    // Unlink (delete) the video file from the physical server
    const videoPath = video.video; // Replace with the actual property name

    const notification = new Notification({
      message: `Your video ${video.title} has been deleted by the admin`,
      type: "video",
      role: "user",
      receiverId: video.userId._id,
    });

    await notification.save();
    const roomId = `user-notification::${video.userId.toString()}`;
    io.emit(roomId, notification);
    fs.unlink(`public/content/${videoPath}`, (unlinkErr) => {
      // Ignore the error and proceed even if unlinking fails
      if (unlinkErr) {
        console.error(unlinkErr);
      }

      return res.status(200).json(response({ message: "Video deleted successfully", statusCode: 200, status: "OK" }));
    });
  } catch (error) {
    console.log(error);
    next(createError(response({ statusCode: 500, message: error, status: "Failed" })));
  }
};

const calculate = async (req, res, next) => {
  try {
    const totalVideo = await Video.countDocuments();
    const totalUsers = await User.countDocuments();
    const payments = await Payment.find();

    // console.log(payments[0].paymentData.amount);
    // Calculate the sum of the "amount" field using reduce
    const totalIncome = payments.reduce((sum, payment) => sum + payment.paymentData.amount, 0);

    // console.log("Total Income:", totalIncome);
    console.log("Total Videos:", totalVideo);

    res.json({ status: 200, data: { totalVideo, totalUsers, totalIncome } });
  } catch (error) {
    console.error(error);
    next(createError(response({ statusCode: 500, message: error, status: "Failed" })));
  }
};

const filterContent = async (req, res, next) => {
  try {
    // Extract query parameters
    const search = req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');

    const filter = {
      $or: [
        { size: { $regex: searchRegExp } },
        { occassionCategory: { $regex: searchRegExp } },
        { material: { $regex: searchRegExp } },
        { gender: { $regex: searchRegExp } },
      ],
    };

    const contents = await Video.find(filter).limit(limit).skip((page - 1) * limit);
    const count = await Video.find(filter).countDocuments();

    return res.status(200).json({
      message: "All videos retrieved successfully",
      type: "All videos",
      statusCode: 200,
      status: "OK",
      data: contents,
      pagination: {
        totalItems: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        limit,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
        prevPage: page - 1 >= 1 ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving matching videos', error: error.message });
  }
};

const occassionalContent = async (req, res, next) => {
  try {
    const findCategory = await category.findById(req.params.categoryId);
    console.log(findCategory.name);
    const contents = await Video.find({ occassionCategory: findCategory.name }).sort({ createdAt: -1 });
    return res.status(200).json(response({ message: "Category wise video retrieve successfully", status: "Okay", statusCode: 200, type: "Content", data: contents }));
  } catch (error) {
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);

    let notifications;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (user && (user._id.toString() === req.body.userId || user.role === "admin")) {
      // If the user exists and is either the same user or an admin
      const query = Notification.find().populate('userId').skip(skip).limit(limit);
      notifications = await query.exec();
      const count = await Notification.countDocuments(query._conditions); // Use the same conditions for countDocuments
      console.log("--------------------------------------------------------------->>>>>>>>>>>>>>>>", notifications.message);

      return res.status(200).json(response({
        message: "Notifications retrieved successfully",
        type: "Notifications",
        statusCode: 200,
        status: "OK",
        NotificationType: "Upload content",
        data: notifications,
        pagination: {
          totalItems: count,
          totalPage: Math.ceil(count / limit),
          currentPage: page,
          limit,
          nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
          prevPage: page - 1 >= 1 ? page - 1 : null,
        },
      }));
    } else {
      return res.status(403).json(response({ message: "Unauthorized", statusCode: 403, status: "Failed" }));
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
};

const linkClickCount = async (req, res, next) => {
  try {
    const linkId = req.params.linkId;
    const link = await Link.updateOne(
      { 'dynamicFields._id': linkId },
      { $inc: { 'dynamicFields.$.count': 1 } }
    );
    // console.log(link.dynamicFields[0].count);
    if (!link) {
      return res.status(404).json(response({ message: "Link not found", statusCode: 404, status: "Not found" }));
    }

    return res.status(200).json(response({ message: "Link count updated successfully", statusCode: 200, status: "OK" }));
  } catch (error) {
    console.log(error);
    next(createError(response({ statusCode: 500, message: error, status: "Failed" })));
  }
}

module.exports = {
  uploadVideo,
  getVideoAsBuffer,
  getNewestVideos,
  getPopularContent,
  searchByTitle,
  searchByCategory,
  filterByGender,
  searchByCategoryProduct,
  getAllVideos,
  myContent,
  similarContent,
  getVideoDetails,
  getContentsByCreator,
  updateContent,
  deleteContent,
  calculate,
  getNotifications,
  occassionalContent,
  showOwnContent,
  getVideoAsBufferWithName,
  linkClickCount
};