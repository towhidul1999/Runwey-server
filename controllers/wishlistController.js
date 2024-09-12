const WishlistModel = require("../models/wishlistSchema");
const User = require("../models/User");
const Video = require("../models/Content");
const response = require("../helpers/response");
const wishlistModel = require("../models/wishlistSchema");
const LikedList = require("../models/likedList");

exports.wishlistAdd = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        console.log("Meow User", user);
        if (req.body.videoId === "") {
            return res.status(400).json(response({ statusCode: 400, message: 'Video ID can not be empty', status: 'Bad request' }));
        }
        const video = await Video.findOne({ _id: req.body.videoId });
        if (!video) {
            return res.status(404).json(response({ statusCode: 404, message: 'Video not found', status: "Not found" }))
        }
        let existWishList = await WishlistModel.findOne({ videoId: req.body.videoId, userId: user._id });
        console.log("gfvjkewfrjgfklfjb3756897054837623", existWishList)
        if (existWishList) {
            return res.status(403).json(response({ message: "You have already added this video to wish list", status: "Exist", statusCode: 403 }))
        }
        const wishlist = await wishlistModel.create({
            videoId: req.body.videoId,
            userId: req.body.userId
        });
        return res.status(201).json(response({ message: "Add to wishlist successfully", statusCode: 201, status: "Created" }))
    } catch (error) {
        console.log(error)
    }
};

exports.wishlistGet = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);

    if (!user) {
      return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
    }

    if (user.role !== "admin") {
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const wishlist = await WishlistModel.find({ userId: user._id }).populate({
        path: 'videoId',
        populate: {
          path: 'userId',
          select: 'fullName image', // Add any other fields you need
        },
      }).sort({ createdAt: -1})
        .skip(skip)
        .limit(limit);

      if (!wishlist || wishlist.length === 0) {
        return res.status(404).json(response({ status: "Not Found", message: "You don't have any video in your wish bucket", data: wishlist, statusCode: 404, type: "Wishlist" }));
      }

      const likedList = await LikedList.find({ userId: user._id, videoId: { $in: wishlist.map(item => item.videoId) } });

      const wishlistVideos = wishlist.map(wishlistItem => {
        const isLiked = likedList.some(likedItem => likedItem.videoId.equals(wishlistItem.videoId._id));
        return {
          wishlistId: wishlistItem._id,  // Include the wishlistId
          videoId: {
            ...wishlistItem.videoId.toObject(),
            isLiked,
          },
          // Include any other fields from wishlistItem if needed
        };
      });

      const totalCount = await WishlistModel.countDocuments({ userId: user._id });
      const totalPages = Math.ceil(totalCount / limit);
      const currentPage = page;

      return res.status(200).json(response({
        message: "Wishlist videos retrieved successfully",
        statusCode: 200,
        status: "OK",
        data: {
          wishlistVideos,
          pagination: {
            totalItems: totalCount,
            totalPages,
            currentPage,
            limit,
          },
        },
      }));
    } else {
      return res.status(401).json({ status: 401, message: "Unauthorized user" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
  }
}; 

// exports.wishlistGet = async (req, res, next) => {
//     try {
//       const user = await User.findById(req.body.userId);
  
//       if (!user) {
//         return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
//       }
  
//       if (user.role !== "admin") {
//         const limit = Number(req.query.limit) || 10;
//         const page = Number(req.query.page) || 1;
//         const skip = (page - 1) * limit;
  
//         const wishlist = await WishlistModel.find({ userId: user._id }).populate('videoId');
//         console.log("wishlist", wishlist)
//         if (!wishlist || wishlist.length === 0) {
//           return res.status(400).json({ status: 400, message: "You don't have any video in your wish bucket" });
//         }
  
//         const videoIds = wishlist.map(item => item.videoId);
  
//         const wishlistVideos = await Video.aggregate([
//           {
//             $match: { _id: { $in: videoIds } }
//           },
//           {
//             $sort: { createdAt: -1 }
//           },
//           {
//             $skip: skip
//           },
//           {
//             $limit: limit
//           },
//           {
//             $lookup: {
//               from: 'likedList', // Assuming your likedList model name is 'LikedList'
//               localField: '_id',
//               foreignField: 'videoId',
//               as: 'likedInfo',
//             },
//           },
//           {
//             $addFields: {
//               isLiked: {
//                 $cond: {
//                   if: {
//                     $in: [req.body.userId, "$likedInfo.userId"],
//                   },
//                   then: true,
//                   else: false,
//                 },
//               },
//             },
//           },
//           {
//             $project: {
//               likedInfo: 0, // Remove unnecessary field from the final result
//             },
//           },
//           {
//             $lookup: {
//               from: 'user', // Assuming your user model name is 'User'
//               localField: 'userId',
//               foreignField: '_id',
//               as: 'user',
//             },
//           },
//           {
//             $unwind: '$user',
//           },
//           {
//             $project: {
//               userId: 0, // Remove unnecessary field from the final result
//               'user.password': 0, // Remove sensitive information
//             },
//           },
//         ]);
  
//         const totalCount = await Video.countDocuments({ _id: { $in: videoIds } });
//         const totalPages = Math.ceil(totalCount / limit);
//         const currentPage = page;
  
//         return res.status(200).json(response({
//           message: "Wishlist videos retrieved successfully",
//           statusCode: 200,
//           status: "OK",
//           data: {
//             wishlistVideos,
//             pagination: {
//               totalItems: totalCount,
//               totalPages,
//               currentPage,
//               limit,
//             },
//           },
//         }));
//       } else {
//         return res.status(401).json({ status: 401, message: "Unauthorized user" });
//       }
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//     }
// };
  
exports.wishlistDeleteMany = async (req, res, next) => {
    // console.log(req.body);
    const { videoId } = req.body;
    try {
        await WishlistModel.deleteMany({ _id: { $in: videoId } });
        return res.status(200).json(response({ message: "Delete successfully", status: "OK", statusCode: 200 }));
    }
    catch (err) {
        next(err.message);
        console.log(err);
    }
};

// exports.wishListedVideo = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.body.userId);

//         if (!user) {
//             return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
//         }

//         const limit = Number(req.query.limit) || 10;
//         const page = Number(req.query.page) || 1;
//         const skip = (page - 1) * limit;

//         const wishListedVideos = await WishlistModel.find({ userId: req.body.userId });

//         const videoIds = wishListedVideos.map(video => video.videoId);

//         const videosFromWishList = await Video.find({ _id: { $in: videoIds } })
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(limit)
//             .populate({
//                 path: 'userId',
//                 select: 'fullName image',
//             });

//         const totalWishListedVideosCount = await Video.countDocuments({ _id: { $in: videoIds } });

//         const totalPages = Math.ceil(totalWishListedVideosCount / limit);

//         return res.status(200).json(response({
//             message: "Wishlisted videos retrieved successfully",
//             statusCode: 200,
//             status: "OK",
//             data: {
//                 videosFromWishList,
//                 pagination: {
//                     totalItems: totalWishListedVideosCount,
//                     totalPages,
//                     currentPage: page,
//                     limit,
//                 },
//             },
//         }));
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//     }
// };

// exports.singleWishListedVideo = async (req, res, next) => {
//     try {
//         const user = await User.findById(req.body.userId);
//         if (!user) {
//             return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
//         };
//         const video = await Video.findOne({_id: req.params.id});
//         console.log(req.params.id);
//         console.log(video);
//         if (!video) {
//             return res.status(404).json(response({ message: 'Video not found', status: "Failed", statusCode: 404 }));
//         }
//         res.status(200).json(response({ message: "Video retrieved successfully", status: "OK", statusCode: 200, data: video }));
//     } catch (error) {
//         res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
//     }
// };

exports.wishListedVideo = async (req, res, next) => {
    try {
      const user = await User.findById(req.body.userId);
  
      if (!user) {
        return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
      }
  
      const limit = Number(req.query.limit) || 10;
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;
  
      const wishListedVideos = await WishlistModel.find({ userId: req.body.userId });
  
      const videoIds = wishListedVideos.map(video => video.videoId);
  
      const videosFromWishList = await Video.aggregate([
        {
          $match: { _id: { $in: videoIds } }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          $lookup: {
            from: 'likedList', // Assuming your likedList model name is 'LikedList'
            localField: '_id',
            foreignField: 'videoId',
            as: 'likedInfo',
          },
        },
        {
          $lookup: {
            from: 'comment', // Assuming your comment model name is 'Comment'
            localField: '_id',
            foreignField: 'videoId',
            as: 'comments',
          },
        },
        {
          $addFields: {
            isLiked: {
              $cond: {
                if: {
                  $eq: [{ $size: '$likedInfo' }, 0],
                },
                then: false,
                else: true,
              },
            },
            totalLikes: { $size: '$likedInfo' },
            totalComments: { $size: '$comments' },
          },
        },
        {
          $project: {
            likedInfo: 0, // Remove unnecessary field from the final result
            comments: 0, // Remove unnecessary field from the final result
          },
        },
        {
          $lookup: {
            from: 'user', // Assuming your user model name is 'User'
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            userId: 0, // Remove unnecessary field from the final result
            'user.password': 0, // Remove sensitive information
          },
        },
      ]);
  
      const totalWishListedVideosCount = await Video.countDocuments({ _id: { $in: videoIds } });
  
      const totalPages = Math.ceil(totalWishListedVideosCount / limit);
  
      return res.status(200).json(response({
        message: "Wishlisted videos retrieved successfully",
        statusCode: 200,
        status: "OK",
        data: {
          videosFromWishList,
          pagination: {
            totalItems: totalWishListedVideosCount,
            totalPages,
            currentPage: page,
            limit,
          },
        },
      }));
    } catch (error) {
      console.error(error);
      return res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
    }
  };  

exports.singleWishListedVideo = async (req, res, next) => {
    try {
        const userId = req.body.userId;
        const videoId = req.params.id;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
        }

        // Check if the video exists
        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json(response({ message: 'Video not found', status: "Failed", statusCode: 404 }));
        }

        // Get the requested wish-listed video for the user
        const requestedWishListedVideo = await WishlistModel.findOne({ userId: userId, videoId: videoId })
            .populate({
                path: 'videoId',
                model: 'Video',
                populate: {
                    path: 'userId',
                    select: 'fullName image',
                },
            });

        // Get other wish-listed videos for the user excluding the requested video
        const otherWishListedVideos = await WishlistModel.find({ userId: userId, videoId: { $ne: videoId } })
            .populate({
                path: 'videoId',
                model: 'Video',
                populate: {
                    path: 'userId',
                    select: 'fullName image',
                },
            });

        const totalWishListedVideosCount = otherWishListedVideos.length + 1;

        res.status(200).json(response({
            message: "Wishlisted videos retrieved successfully",
            statusCode: 200,
            status: "OK",
            data: {
                wishListedVideos: [requestedWishListedVideo, ...otherWishListedVideos],
                pagination: {
                    totalItems: totalWishListedVideosCount,
                    totalPages: 1,
                    currentPage: 1,
                    limit: totalWishListedVideosCount,
                },
            },
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json(response({ message: error.message, statusCode: 500, status: "Failed" }));
    }
};




