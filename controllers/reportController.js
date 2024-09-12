const Rating = require('../models/Rating');
const Content = require('../models/Content');
const response = require('../helpers/response');
const Report = require('../models/Report');

const report = async (req, res) => {
    try {
        const id = req.params.id;
        const reportMessage = req.body.reportMessage;
        console.log(reportMessage);

        // Search for the item in both collections
        const comment = await Rating.findById(id);
        const content = await Content.findById(id);

        // Check if the user has already reported this item
        const existingReport = await Report.findOne({ reportTo: id, reporter: req.body.userId });
        if (existingReport) {
            return res.status(400).json(response({message: "You have already reported this item", statusCode: 400, status: "Failed" }));
        }
        
        // Check if either comment or content is found
        if (comment) {
            // If a comment is found, respond with the comment
            const report = await Report.create({
                reportTo: id,
                reporter: req.body.userId,
                reportMessage: reportMessage,
                reportType: "Comment",
            });

            res.status(200).json(response({ data: report, statusCode: 200, status: "Okay" }));
        } else if (content) {
            // If a content is found, respond with the content
            const report = await Report.create({
                reportTo: id,
                reporter: req.body.userId,
                reportMessage: reportMessage,
                reportType: "Content",
            })
            res.status(200).json(response({ data: report, statusCode: 200, status: "Okay" }));
        } else {
            // If neither comment nor content is found, respond with a not found message
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = report;
