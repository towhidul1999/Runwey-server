const response = require("../helpers/response");
const User = require("../models/User");
const Subscribe = require("../models/subscribeSchema");
const mongoose = require('mongoose');

const addSubscribe = async (req, res) => {
    try {
        let user = await User.findById(req.body.userId);
        console.log(user)

        const { name, price, validity, limitation, mainColor, opacity1, opacity2, opacity3, type } = req.body
        if (user.role == "admin") {

            const subscriptionDetails = await Subscribe.create({
                name,
                price,
                validity,
                limitation,
                mainColor,
                opacity1,
                opacity2,
                opacity3,
                userId: user._id,
                type
            });

            return res.status(200).json({ statusCode: 200, message: "Subscription Add successful", status: "OK", data: subscriptionDetails, type: "subscribe" });

        } else {
            return res.status(401).json({ statusCode: 401, message: "Unauthorized user" })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json(response({ message: "Internal Server Error", status: "ERROR", statusCode: 500 }))
    }
};

const getSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;


        if (!subscriptionId) {
            return res.status(400).json({ statusCode: 400, message: "Invalid subscription ID" });
        }


        const subscription = await Subscribe.findById(subscriptionId);


        if (!subscription) {
            return res.status(404).json({ statusCode: 404, message: "Subscription not found" });
        }


        return res.status(200).json({ status: "OK", statusCode: 200, data: subscription });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    }
};

const getSubscriptions = async (req, res) => {
    try {
        const allSubscriptions = await Subscribe.aggregate([
            {
                $match: {
                    type: { $in: ['Regular', 'Standard', 'Premium'] } // Filter to include only specified types
                }
            },
            {
                $project: {
                    _id: 0,
                    name: '$type', // Set 'name' field as 'type'
                    package: {
                        _id: '$_id', // Set 'package._id' as '_id'
                        name: '$name', // Set 'name' field in 'package' as 'type'
                        price: { $toDouble: '$price' },
                        validity: { $toInt: '$validity' },
                        limitation: { $toInt: '$limitation' },
                        mainColor: '$mainColor',
                        opacity1: '$opacity1',
                        opacity2: '$opacity2',
                        opacity3: '$opacity3'
                    }
                }
            }
        ]);
        console.log("----------------------==============================",allSubscriptions);
        return res.status(200).json({ status: "OK", statusCode: 200, data: allSubscriptions });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ statusCode: 500, message: "Internal Server Error" });
    }
}

const updateSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;
        const user = await User.findOne({ _id: req.body.userId });
        console.log(user)

        // Check if the subscription ID is valid
        if (!subscriptionId) {
            return res.status(400).json({ statusCode: "400", status: "Invalid Id", message: "Invalid subscription ID" });
        }

        // Find the subscription by ID in the database
        const subscription = await Subscribe.findById(subscriptionId);

        // Check if the subscription exists
        if (!subscription) {
            return res.status(404).json({ statusCode: 404, status: "Not Found", message: "Subscription not found" });
        }

        // Update the subscription properties with the values from the request body
        const { name, price, validity, limitation, mainColor, opacity1, opacity2, opacity3 } = req.body;

        // Update only the provided fields (if they exist in the request body)
        if (user.role == "admin") {
            if (name) subscription.name = name;
            if (price) subscription.price = price;
            if (validity) subscription.validity = validity;
            if (limitation) subscription.limitation = limitation;
            if (mainColor) subscription.mainColor = mainColor;
            if (opacity1) subscription.opacity1 = opacity1;
            if (opacity2) subscription.opacity2 = opacity2;
            if (opacity3) subscription.opacity3 = opacity3;

            // Save the updated subscription to the database
            await subscription.save();

            // Return the updated subscription details
            return res.status(200).json({ statusCode: 200, status: "OK", data: subscription, message: "Subscription updated successfully" });
        } else {
            res.status(401).json(response({ statusCode: 401, message: 'You are not authorized', status: "Unauthorized" }))
        }





    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, status: "Server Error", message: "Internal Server Error" });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        const subscriptionId = req.params.id;

        // Check if the subscription ID is valid
        if (!subscriptionId) {
            return res.status(400).json({ statusCode: 400, status: "Invalid Id", message: "Invalid subscription ID" });
        }

        // Find the subscription by ID in the database
        const subscription = await Subscribe.findById(subscriptionId);
        console.log(subscription)

        // Check if the subscription exists
        if (!subscription) {
            return res.status(404).json({ statusCode: 404, status: "Subscription Not Found", message: "Subscription not found" });
        }

        // Delete the subscription from the database
        await subscription.deleteOne();

        // Return a success message
        return res.status(200).json({ statusCode: 200, status: "OK", message: "Subscription deleted successfully" });
    } catch (error) {
        // Handle any errors that might occur during the process
        console.error(error);
        return res.status(500).json({ statusCode: 500, status: "Server Error", message: "Internal Server Error" });
    }
};

const subscribe = async (req, res) => {
    try {
        console.log(req.params.subcriptionId);
        console.log(typeof (req.params.subcriptionId));
        console.log(req.params.subcriptionId);
        const subcriptionPackage = await Subscribe.findById(req.params.subcriptionId);
        if (!subcriptionPackage) {
            return res.status(404).json({ message: 'Subscription package not found' });
        }
        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role === "user" || user.role === "creator" && !user.subcriptionType) {
            user.subcriptionType = req.body.subcriptionType;
            await user.save();
            res.status(200).json({ message: 'User subscribed successfully' });
        } else {
            res.status(401).json({ message: 'You are not authorized to subscribe' });
        }

    } catch (error) {
        console.log("hjksf---------->>>>>>>>>>>>>>", error.message);
        res.status(500).json(error.message);
    }
};

const subscriptionDisable = async (req, res) => {
    try {
        const user = await User.findById(req.body.userId);
        if (!user && user.role !== "admin") {
            return res.status(404).json({ message: 'User not found' });
        }
        let subcriptionPackage = await Subscribe.findById(req.params.subcriptionId);
        console.log(subcriptionPackage.disable)
        if (subcriptionPackage.disable === true) {
            subcriptionPackage.disable = false;
            await subcriptionPackage.save();
            return res.status(200).json({ message: 'Subscription package enabled successfully' });
        };
        if (subcriptionPackage.disable === false) {
            subcriptionPackage.disable = true;
            await subcriptionPackage.save();
            return res.status(200).json({ message: 'Subscription package disabled successfully' });
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json(error.message);
    }

};

module.exports = {
    addSubscribe,
    getSubscription,
    getSubscriptions,
    updateSubscription,
    deleteSubscription,
    subscribe,
    subscriptionDisable
};