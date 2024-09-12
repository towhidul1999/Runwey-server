const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const response = require('../helpers/response');
const User = require('../models/User');

const isValidUser = async (req, res, next) => {
    try {
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json(response({ message: 'Unauthorized' }));
        }

        if (!authorization.startsWith('Bearer')) {
            return res.status(403).json(response({ message: 'Invalid token format' }));
        }

        const token = authorization.split(' ')[1];

        let decodedData;
        try {
            decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(401).json(response({ message: 'Token expired' }));
            } else if (error instanceof jwt.JsonWebTokenError) {
                // For other JWT errors, still return 401 Unauthorized
                return res.status(401).json(response({ message: 'Invalid token' }));
            } else {
                // For unexpected errors, return 500 Internal Server Error
                throw error;
            }
        }

        const user = await User.findById(decodedData._id);

        if (!user) {
            return next(createError(401, 'Unauthorized'));
        }

        req.body.userId = decodedData._id;
        req.body.userRole = decodedData.role;
        req.user = decodedData._id;

        next();
    } catch (error) {
        console.error(error.message);
        return next(createError(500, 'Internal Server Error'));
    }
};

module.exports = { isValidUser };