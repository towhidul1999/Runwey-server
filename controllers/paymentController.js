const stripe = require('stripe')('sk_test_51NiWAKHloEqm4Hcr2bW9Od8OZL1ySHO48NmyqgylSNkvRfp3GRAtAPcgr0EldrlZQ5QbnrdPDOTlI8UmIGxv11di00HWChl1wB');
const response = require('../helpers/response');
// const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const MySubscription = require('../models/MySubscription');
const Subscribe = require('../models/subscribeSchema');
const Notification = require('../models/Notification');
const { subscribe } = require('../routes/userRouter');

const payment = async (req, res) => {
    try {
        const { subscriptionId, token } = req.body;
        const product = await Subscribe.findById(subscriptionId);
        console.log("Product Type:", product.type);

        const user = await User.findById(req.body.userId);
        console.log("User Subscription Type (Before):", user.subcriptionType);

        if (!user) {
            return res.status(404).json({ message: 'Request is not found for payment' });
        }

        // Temporarily remove the gender value to avoid validation issues
        const originalGender = user.gender;
        user.gender = undefined;

        const customer = await stripe.customers.create({
            email: user.email,
            source: token.id,
        });

        // Restore the original gender value
        user.gender = originalGender;

        const paymentData = await stripe.charges.create({
            amount: product.price * 100,
            currency: 'usd',
            customer: customer.id,
            receipt_email: user.email,
            description: `${product.name}`,
            shipping: {
                name: "John Doe", // Replace with actual name
                address: {
                    country: "US", // Replace with actual country code
                },
            },
        });

        // Save payment data to the MongoDB collection 'paymentData'
        await Payment.create({
            userId: user._id,
            paymentData,
        });

        // Safely update subscription type
        if (product.type !== user.subcriptionType) {
            user.subcriptionType = product.type;
            await user.save();
        }

        // Handle MySubscription
        const mySubscription = await MySubscription.findOne({ userId: user._id });

        if (mySubscription) {
            mySubscription.subscriptionId = product._id;
            mySubscription.expiryDate = new Date(mySubscription.expiryDate.getTime() + product.validity * 30 * 24 * 60 * 60 * 1000);
            mySubscription.subscriptionType = product.type;
            await mySubscription.save();
        } else {
            const expiryDate = new Date(Date.now() + product.validity * 30 * 24 * 60 * 60 * 1000);
            await MySubscription.create({
                userId: user._id,
                subscriptionId: product._id,
                expiryDate,
                subscriptionType: product.type,
            });
        }

        // Set up subscription expiration notification
        const delay = mySubscription.expiryDate.getTime() - Date.now();

        setTimeout(async () => {
            const updatedSubscription = await MySubscription.findOne({ userId: user._id });

            if (updatedSubscription.expiryDate < new Date()) {
                const roomId = "user-notification::" + user._id;
                const notifMessage = "Your subscription " + product.name + " has been expired";
                const notification = {
                    receiverId: user._id,
                    message: notifMessage,
                    type: "my-subscription",
                    role: "user",
                };

                await Notification.create(notification);
                user.subcriptionType = "Regular";
                await user.save();

                const regularSub = await Subscribe.findOne({ type: "Regular" });
                updatedSubscription.subscriptionId = regularSub._id;
                updatedSubscription.expiryDate = new Date();
                updatedSubscription.subscriptionType = regularSub.type;

                await updatedSubscription.save();
                io.emit(roomId, notification);
            }
        }, delay);

        // Log admin notification
        const adminMessage = `${user.fullName} has purchased ${product.name} subscription`;
        const adminNotification = {
            message: adminMessage,
            type: "my-subscription",
            role: "admin",
        };

        await Notification.create(adminNotification);
        io.emit('admin-notification', { message: "New notification arrived" });

        res.status(200).json(response({ message: 'Payment success', data: paymentData, type: 'Payment', status: "Okay", statusCode: 200 }));
    } catch (error) {
        // Handle validation error for the gender field
        if (error.name === 'ValidationError' && error.errors && error.errors.gender) {
            console.error('Validation error for gender field:', error.errors.gender.message);
            return res.status(400).json({ message: 'Validation error for gender field', error: error.errors.gender.message });
        } else {
            // Handle other errors
            console.error(error);
            res.status(500).json({ message: 'An error occurred while processing the payment.', error: error.message });
        }
    }
};

const paymentfromStore = async (req, res) => {
    try {
        const { paymentData, package } = req.body;
        console.log("Package:", package);
        
        const findPackage = await Subscribe.findOne({ name: package });
        console.log("Package found:", findPackage);

        if (!findPackage) {
            return res.status(404).json(response({ message: 'Package is not valid', type: "packages", status: "OK", statusCode: 200 }));
        }

        const user = await User.findById(req.body.userId);
        console.log("User:", user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create payment record
        await Payment.create({
            userId: req.body.userId,
            paymentData,
        });

        // Create or update MySubscription
        let mySubscription = await MySubscription.findOne({ userId: user._id });

        if (mySubscription) {
            mySubscription.subscriptionId = findPackage._id;
            mySubscription.expiryDate = new Date(mySubscription.expiryDate.getTime() + findPackage.validity * 30 * 24 * 60 * 60 * 1000);
            mySubscription.subscriptionType = findPackage.type;
            await mySubscription.save();
        } else {
            const expiryDate = new Date(Date.now() + findPackage.validity * 30 * 24 * 60 * 60 * 1000);
            mySubscription = await MySubscription.create({
                userId: user._id,
                subscriptionId: findPackage._id,
                expiryDate,
                subscriptionType: findPackage.type,
            });
        }

        // Set up subscription expiration notification
        const delay = mySubscription.expiryDate.getTime() - Date.now();

        setTimeout(async () => {
            const updatedSubscription = await MySubscription.findOne({ userId: user._id });

            if (updatedSubscription.expiryDate < new Date()) {
                const roomId = "user-notification::" + user._id;
                const notifMessage = "Your subscription " + findPackage.name + " has expired";
                const notification = {
                    receiverId: user._id,
                    message: notifMessage,
                    type: "my-subscription",
                    role: "user",
                };

                await Notification.create(notification);
                user.subcriptionType = "Regular";
                await user.save();

                const regularSub = await Subscribe.findOne({ type: "Regular" });
                updatedSubscription.subscriptionId = regularSub._id;
                updatedSubscription.expiryDate = new Date();
                updatedSubscription.subscriptionType = regularSub.type;

                await updatedSubscription.save();
                io.emit(roomId, notification);
            }
        }, delay);

        // Log admin notification
        const adminMessage = `${user.fullName} has purchased ${findPackage.name} subscription`;
        const adminNotification = {
            message: adminMessage,
            type: "my-subscription",
            role: "admin",
        };

        await Notification.create(adminNotification);
        io.emit('admin-notification', { message: "New notification arrived" });

        // Safely update subscription type
        if (findPackage.type !== user.subcriptionType) {
            user.subcriptionType = findPackage.type;
            await user.save();
        }

        res.status(200).json(response({ message: 'Payment success', data: paymentData, type: 'Payment', status: "Okay", statusCode: 200 }));
    } catch (error) {
        console.log("Payment failed");
        console.log(error);
        return res.status(400).json(response({ message: 'Payment failed', status: "ERROR", statusCode: 400 }))
    }
};

// Simple in-memory cache (adjust for your production needs)
const cache = new Map();

const incomeDetails = async (req, res) => {
    try {
        // Check the cache first
        const cachedResult = cache.get("incomedetails");
        if (cachedResult) {
            console.log("Returning cached result");
            return res.status(200).json(cachedResult);
        }
        console.timeEnd("cached");

        // Start measuring the overall execution time
        console.time("incomedetails");

        // Get initial memory usage
        const initialMemoryUsage = process.memoryUsage();

        // Get the current date
        const currentDate = new Date();
        // Set the time to the beginning of the day
        currentDate.setHours(0, 0, 0, 0);

        // Start measuring the time for finding all payments
        console.time("findAllPayments");
        const allPayments = await Payment.find();

        console.timeEnd("findAllPayments");
        console.log("Memory usage after finding all payments:", initialMemoryUsage);

        // Start measuring the time for calculating total income
        console.time("calculateTotalIncome");
        const totalIncome = allPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);
        console.timeEnd("calculateTotalIncome");

        // Start measuring the time for finding payments created today
        console.time("findTodayPayments");
        const todayPayments = allPayments.filter(payment => payment.createdAt >= currentDate);
        console.timeEnd("findTodayPayments");

        // Start measuring the time for calculating daily total income
        console.time("calculateDailyTotalIncome");
        const dailyTotalIncome = todayPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);
        console.timeEnd("calculateDailyTotalIncome");

        // Start measuring the time for finding payments created in the current week
        console.time("findWeekPayments");
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start of the current week
        const weekPayments = allPayments.filter(payment => payment.createdAt >= startOfWeek);
        console.timeEnd("findWeekPayments");

        // Start measuring the time for calculating weekly total income
        console.time("calculateWeeklyTotalIncome");
        const weeklyTotalIncome = weekPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);
        console.timeEnd("calculateWeeklyTotalIncome");

        // Start measuring the time for finding payments created in the current month
        console.time("findMonthPayments");
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthPayments = allPayments.filter(payment => payment.createdAt >= startOfMonth);
        console.timeEnd("findMonthPayments");

        // Start measuring the time for calculating monthly total income
        console.time("calculateMonthlyTotalIncome");
        const monthlyTotalIncome = monthPayments.reduce((total, payment) => total + payment.paymentData.amount, 0);
        console.timeEnd("calculateMonthlyTotalIncome");

        // Stop measuring the overall execution time
        console.timeEnd("incomedetails");

        // Cache the result for future requests
        const resultToCache = {
            message: "Successfully Total income details",
            status: "OKAY",
            statusCode: 200,
            type: "Payment",
            data: {
                totalIncome,
                dailyTotalIncome,
                weeklyTotalIncome,
                monthlyTotalIncome
            }
        };
        cache.set("incomedetails", resultToCache);
        // Log the contents of the cache
        console.log("Updated cache:", cache);


        return res.status(200).json(response({ data: resultToCache, status: "Okay", statusCode: 200, tyoe: "Pyament" }));
    } catch (error) {
        console.error(error);
        return res.status(500).json(response({ message: "Internal server error" }));
    }
};

const transaction = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        console.log(user);
        let payment;
        if (user.role === "admin") {
            payment = await Payment.find().populate('userId');
        } else {
            return res.status(403).json(response({ message: "You are not allowed to access this route", status: "Failed", statusCode: 403, type: "Payment" }));
        }
        if (!payment) {
            return res.status(404).json(response({ message: "Transaction is  not found", status: "Failed", satusCode: 404, type: "Payment" }));
        }

        return res.status(200).json(response({ data: payment, message: "Transaction found succesfully", status: "Okay", statusCode: 200, type: "Payment" }));
    } catch (error) {
        console.error(error);
        return res.status(500).json(response({ message: "Internel server error" }));
    }

};

const getPaymentTotal = async (startDate, endDate) => {
    try {
        const payments = await Payment.find({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            }
        });

        return payments.reduce((sum, payment) => sum + payment.paymentData.amount, 0);
    } catch (error) {
        console.error(error);
        throw error; // Rethrow the error to handle it in the calling function
    }
};

const earningChart = async (req, res) => {
    try {
        const dateRanges = [
            { start: '2023-12-01T00:00:00.000Z', end: '2023-12-05T00:00:00.000Z' },
            { start: '2023-12-06T00:00:00.000Z', end: '2023-12-10T00:00:00.000Z' },
            { start: '2023-12-11T00:00:00.000Z', end: '2023-12-15T00:00:00.000Z' },
            { start: '2023-12-16T00:00:00.000Z', end: '2023-12-20T00:00:00.000Z' },
            { start: '2023-12-21T00:00:00.000Z', end: '2023-12-25T00:00:00.000Z' },
            { start: '2023-12-26T00:00:00.000Z', end: '2023-12-30T00:00:00.000Z' }
        ];

        const result = await Promise.all(dateRanges.map(async ({ start, end }) => {
            const totalAmount = await getPaymentTotal(new Date(start), new Date(end));

            // Assuming you have a User model with a 'packageBought' field
            const usersWithPackageCount = await User.countDocuments({ packageBought: true, createdAt: { $gte: new Date(start), $lte: new Date(end) } });

            return {
                days: `${start}-${end}`,
                totalAmount,
                usersWithPackageCount,
            };
        }));

        console.log(result);
        res.json({ status: 200, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

const yearlyIncomeCha = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        const totalAmount = await getPaymentTotal(startDate, endDate);
        const checkAdmin = await User.findById(req.body.userId);
        if (checkAdmin.role === "admin") {
            return res.status(200).json(response({ message: "Yearly income retrive successfully", statusCode: 200, status: "Okay", data: totalAmount, type: "Payment" }));
        }
        console.log("totalmount");
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

const yearlyIncomeChart = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, index) => index); // 0 to 11 representing months

        const result = await Promise.all(months.map(async (month) => {
            const start = new Date(currentYear, month, 1);
            const end = new Date(currentYear, month + 1, 0); // Last day of the month

            const totalAmount = await getPaymentTotal(start, end);

            // Assuming you have a User model with a 'packageBought' field
            const usersWithPackageCount = await User.countDocuments({ packageBought: true, createdAt: { $gte: start, $lte: end } });

            return {
                year: currentYear,
                month: start.toLocaleString('en-US', { month: 'long' }), // e.g., January
                totalAmount,
                usersWithPackageCount,
            };
        }));

        console.log(result);
        res.json({ status: 200, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

const yearlyIncome = async (req, res) => {
    try {
        const startYear = 2023; // Replace with the desired start year
        const endYear = new Date().getFullYear();
        const years = Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);

        const result = await Promise.all(years.map(async (year) => {
            const start = new Date(year, 0, 1); // January 1st of the year
            const end = new Date(year, 11, 31); // December 31st of the year

            const totalAmount = await getPaymentTotal(start, end);

            // Assuming you have a User model with a 'packageBought' field
            const usersWithPackageCount = await User.countDocuments({ packageBought: true, createdAt: { $gte: start, $lte: end } });

            return {
                year,
                totalAmount,
                usersWithPackageCount,
            };
        }));

        console.log(result);
        res.json({ status: 200, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
};

const weeklyIncome = async (req, res) => {
    try {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the current week
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // End of the current week

        const totalAmount = await getPaymentTotal(startOfWeek, endOfWeek);

        // Assuming you have a User model with a 'packageBought' field
        const usersWithPackageCount = await User.countDocuments({ packageBought: true, createdAt: { $gte: startOfWeek, $lte: endOfWeek } });

        res.json({ status: 200, data: { totalAmount, usersWithPackageCount } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }

};

module.exports = { payment, incomeDetails, transaction, earningChart, yearlyIncomeChart, yearlyIncome, weeklyIncome, yearlyIncomeCha, paymentfromStore };