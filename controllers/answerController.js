// const { response } = require("express");
const User = require("../models/User");
const Answer = require("../models/answerModel");
const response = require('../helpers/response')



const questionAnswer = async (req, res) => {
    try {
        let user = await User.findById(req.body.userId);
        console.log(user)

        const answer = req.body;


        if (user.role == "user") {

            const questionAnsDetails = await Answer.create({
                answer,
                userId: user._id
            });
            user.role = "pendingCreator";
            await user.save();
            return res.status(200).json({ statusCode: 200, message: "Question Add successful", status: "OK", data: questionAnsDetails, type: "question-answer" });

        } else {
            return res.status(401).json({ statusCode: 401, message: "UnAuthorized user" })
        }

        // res.json({
        //     status: 200,
        //     message: 'Array of objects retrieved successfully',
        //     data: questionAnswers
        // });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: 500, message: 'Internal server error' });
    }
};

const getQuestionAnswer = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        const limit = Number(req.query.limit) || 10;
        const page = req.query.page || 1;
        const skip = (page - 1) * limit;
        console.log(user)
        if (user.role === 'admin') {
            const questionAnswers = await Answer.find()
                .limit(limit)
                .skip(skip)
                .populate('userId');
            const total = await Answer.countDocuments();
            const totalPages = Math.ceil(total / limit);

            return res.status(200).json({
                statusCode: 200, message: "Question Add successful", status: "OK", data: {
                    questionAnswers,
                    pagination: {
                        totalResults: total,
                        totalPage: totalPages,
                        currentPage: page,
                        limit: limit,

                    }
                }, type: "question-answer"
            });

        }
        else {
            return res.status(401).json({ statusCode: 401, message: "UnAuthorized user" })
        }
    }
    catch (error) {
        console.error(error.message);
        res.status(500).json({ status: 500, message: error.message });
    }
}

// Get answer
const getQuestionAnswerById = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if(user.role === 'admin'){
            const questionAnswer = await Answer.findOne({userId: req.params.userId}).populate('userId');
            console.log(questionAnswer);
            return res.status(200).json(response({message: "Answer retrieved successfully", statusCode: 200, status: "Okay", data: questionAnswer}));
        }
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Error converting user to creator', error });
    }
};

const singleContentCreator = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        console.log(user);
        if(user.role === 'admin'){
            const questionAnswer = await Answer.findById(req.params.id).populate('userId');
            console.log(questionAnswer);
            return res.status(200).json(response({message: "Answer retrieved successfully", statusCode: 200, status: "Okay", data: questionAnswer}));
        }
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Error converting user to creator', error });
    }
};

module.exports = {
    questionAnswer,
    getQuestionAnswer,
    getQuestionAnswerById,
    singleContentCreator
};