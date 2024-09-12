const createError = require('http-errors');
const response = require("../helpers/response");
const Rating = require("../models/Rating");
const User = require('../models/User');
const Video = require('../models/Content');
const Report = require('../models/Report');

const createRating = async (req, res, next) => {
    try {
        const { rating, message } = req.body;
        const videoId = req.params.videoId;

        let user = await User.findById(req.body.userId);

        if (!videoId) {
            return res.status(400).json(response({ status: 400, message: 'Invalid video ID' }));
        }

        if (user.role === 'user' || user.role === 'creator') {
            // Check if the user has already given a rating for the video
            const existingRating = await Rating.findOne({ userId: user._id, videoId: videoId });

            if (existingRating) {
                return res.status(403).json(response({ status: "Exist", message: 'User has already given a rating for this video', statusCode: 403, type: 'rating' }));
            }

            const newRating = await Rating.create({
                ratings: rating,
                userId: user._id,
                message: message,
                videoId: videoId
            });

            // Calculate the new average rating for the video
            const ratings = await Rating.find({ videoId: videoId });
            const totalRatings = ratings.length;
            const totalRatingSum = ratings.reduce((sum, rating) => sum + rating.ratings, 0);
            const averageRating = totalRatingSum / totalRatings;

            // Update the average rating in the Video model
            const video = await Video.findById(videoId);
            video.ratings = averageRating;
            await video.save();

            // Populate the userId field to get the user details
            const populatedRating = await newRating.populate('userId');

            return res.json(response({
                message: 'Rating created successfully',
                type: 'create rating',
                status: 'OK',
                statusCode: 200,
                data: populatedRating
            }));
        } else {
            return res.status(400).json(response({ status: 400, message: 'User not found' }));
        }
    } catch (error) {
        console.error(error);
        next(createError(response({ statusCode: 500, message: 'Internal server error', status: 'Failed' })));
    }
};

const getRatingsByVideoId = async (req, res, next) => {
    try {
        const videoId = req.params.videoId;

        // Check if the video ID is valid
        if (!videoId) {
            return res.status(400).json({ status: 400, message: "Invalid video ID" });
        }

        // Find ratings by video ID in the database
        const ratings = await Rating.find({ videoId: videoId });

        // Check if ratings exist
        if (ratings.length === 0) {
            return res.status(404).json({ status: 404, message: "No ratings found for the specified video ID" });
        }

        // Calculate average rating
        const totalRatings = ratings.length;
        const sumRatings = ratings.reduce((sum, rating) => sum + rating.value, 0);
        const averageRating = sumRatings / totalRatings;

        // Return the average rating for the specified video ID
        res.json(response({
            message: 'Average rating retrieved successfully',
            type: "get ratings by videoId",
            status: "OK",
            statusCode: 200,
            data: { videoId, averageRating }
        }));
    } catch (error) {
        console.error("Error getting ratings by videoId:", error);
        next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
    }
};

const deleteRating = async (req, res, next) => {
    try {
        const ratingId = req.params.ratingId;

        // Check if the rating ID is valid
        if (!ratingId) {
            return res.status(400).json({ status: 400, message: "Invalid rating ID" });
        }

        // Find the rating by ID in the database
        const rating = await Rating.findById(ratingId);

        // Check if the rating exists
        if (!rating) {
            return res.status(404).json({ status: 404, message: "Rating not found" });
        }

        // Delete the associated reports
        await Report.deleteMany({ reportTo: ratingId });

        // Delete the rating from the database
        await rating.remove();

        // Return a success message
        res.json(response({
            message: 'Rating and associated reports deleted successfully',
            type: "delete rating",
            status: "OK",
            statusCode: 200,
            data: rating
        }));
    } catch (error) {
        console.error("Error deleting rating:", error);
        next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
    }
};

module.exports = {
    createRating,
    getRatingsByVideoId,
    deleteRating
};