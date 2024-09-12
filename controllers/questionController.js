const User = require("../models/User");
const Question = require("../models/questionModel");
const { questionAnswer } = require("./answerController");

const addQuestion = async (req, res) => {
    try {
        let user = await User.findById(req.body.userId);
        console.log(user)

        const { question } = req.body
        if (user.role == "admin") {

            const questionDetails = await Question.create({
                question
            });

            return res.status(200).json({ statusCode: 200, message: "Question Add successful", status: "OK", data: questionDetails, type: "question" });

        } else {
            return res.status(401).json({ statusCode: 401, message: "UnAuthorized user" })
        }

    } catch (error) {
        console.log(error)
    }
}

const getQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;


        if (!questionId) {
            return res.status(400).json({ statusCode: 400, message: "Invalid question ID" });
        }


        const question = await Question.findById(questionId);


        if (!question) {
            return res.status(404).json({ statusCode: 404, message: "Question not found" });
        }


        return res.status(200).json({ status: "OK", statusCode: 200, data: question });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    }
}

const getQuestions = async (req, res) => {
    try {
        const Questions = await Question.find();

        if (!Questions) {
            return res.status(404).json({ status: 404, message: "Questions not found" });
        }

        return res.status(200).json({ status: "OK", statusCode: 200, data: Questions });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    }
}

const updateQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;

        // Check if the subscription ID is valid
        if (!questionId) {
            return res.status(400).json({ statusCode: "400", status: "Invalid Id", message: "Invalid subscription ID" });
        }

        // Find the subscription by ID in the database
        const questions = await Question.findById(questionId);

        // Check if the questions exists
        if (!questions) {
            return res.status(404).json({ statusCode: 404, status: "Not Found", message: "questions not found" });
        }

        // Update the subscription properties with the values from the request body
        const { question } = req.body;

        // Update only the provided fields (if they exist in the request body)
        if (question) questions.question = question;

        // Save the updated subscription to the database
        await questions.save();

        // Return the updated subscription details
        return res.status(200).json({ statusCode: 200, status: "OK", data: question, message: "Questtion updated successfully" });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, status: "Server Error", message: "Internal Server Error" });
    }
}

const deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;

        // Check if the subscription ID is valid
        if (!questionId) {
            return res.status(400).json({ statusCode: 400, status: "Invalid Id", message: "Invalid subscription ID" });
        }

        // Find the subscription by ID in the database
        const question = await Question.findById(questionId);
        console.log(question)

        // Check if the question exists
        if (!question) {
            return res.status(404).json({ statusCode: 404, status: "question Not Found", message: "question not found" });
        }

        // Delete the question from the database
        await question.deleteOne();

        // Return a success message
        return res.status(200).json({ statusCode: 200, status: "OK", message: "Question deleted successfully" });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, status: "Server Error", message: "Internal Server Error" });
    }
}

module.exports = {
    addQuestion,
    getQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion
};