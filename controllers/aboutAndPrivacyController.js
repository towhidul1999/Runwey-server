const aboutUsModel = require("../models/aboutUsSchema");
const policyModel = require("../models/policySchema");
const termAndConditionModel = require("../models/termAndConditionSchema");
const User = require("../models/User");

exports.aboutUs = async (req, res) => {

    const { aboutUs } = req.body
    //console.log("tushar",req.body.userId)
    let user = await User.findById(req.body.userId);

    if (user.role == "admin") {

        try {
            let aboutus = await aboutUsModel.findOne();
            if (!aboutus) {
                if (aboutUs) {
                    const aboutus = new aboutUsModel({
                        aboutUs
                    });

                    await aboutus.save();

                    return res.status(200).json({ status: 200, message: "About us add successfully" })

                } else {
                    return res.status(400).json({ status: 400, message: "About us field is required" })
                }

            } else {
                aboutus.aboutUs = aboutUs;
                await aboutus.save();
                return res.status(200).json({ status: 200, message: "About us updated successfully" })
            }

        } catch (err) {
            console.log(err)
        }
    } else {
        return res.status(401).json({ status: 401, message: "UnAuthorized user" })
    }

}


exports.aboutUsFetch = async (req, res) => {
        try {

            let aboutus = await aboutUsModel.findOne();
            if (aboutus) {
                return res.status(200).json({ status: 200, message: "Data get successfully", data: aboutus })
            } else {
                return res.status(200).json({ status: 200, message: "Don't have any data in aboutus" })

            }

        } catch (err) {
            return res.status(401).json({ status: 401, message: err.message })
        }
}

exports.privacy = async (req, res) => {

    let user = await User.findById(req.body.userId);

    const { policy } = req.body
    if (user.role == "admin") {


        try {

            let privacyPolicy = await policyModel.findOne();

            if (!privacyPolicy) {
                if (policy) {
                    const privacyPolicy = new policyModel({
                        policy
                    });

                    await privacyPolicy.save();

                    return res.status(200).json({ status: 200, message: "Privacy policy add successfully" })
                } else {
                    return res.status(400).json({ status: 400, message: "Privacy policy field is required" })
                }
            } else {
                privacyPolicy.policy = policy;
                await privacyPolicy.save();
                return res.status(200).json({ status: 200, message: "Privacy policy update successfully" })
            }

        } catch (err) {
            console.log(err)
        }


    } else {
        return res.status(401).json({ status: 401, message: "UnAuthorized user" })
    }

}


exports.privacyFetch = async (req, res) => {
        try {

            let privacy = await policyModel.findOne();
            if (privacy) {
                return res.status(200).json({ status: 200, message: "Data get successfully", data: privacy })
            } else {
                return res.status(200).json({ status: 200, message: "Don't have any data in Privacy policy" })

            }

        } catch (err) {
            return res.status(401).json({ status: 401, message: err.message })
        }

}


exports.termAndCondition = async (req, res) => {

    let user = await User.findById(req.body.userId);

    const { termAndCondition } = req.body



    if (user.role == "admin") {


        try {

            let termAndcondition = await termAndConditionModel.findOne();

            if (!termAndcondition) {
                if (termAndCondition) {
                    const termAndcondition = new termAndConditionModel({
                        termAndCondition
                    });

                    await termAndcondition.save();

                    return res.status(200).json({ status: 200, message: "Term and condition add successfully" })
                } else {
                    return res.status(400).json({ status: 400, message: "Term and condition field is required" })
                }
            } else {
                termAndcondition.termAndCondition = termAndCondition;
                await termAndcondition.save();
                return res.status(200).json({ status: 200, message: "Term and condition updated successfully" });
            }




        } catch (err) {
            return res.status(401).json({ status: 401, message: err.message })
        }


    } else {
        return res.status(401).json({ status: 401, message: "UnAuthorized user" })
    }

}


exports.termAndConditionFetch = async (req, res) => {

        try {

            let termAndCondition = await termAndConditionModel.findOne();
            if (termAndCondition) {
                return res.status(200).json({ status: 200, message: "Data get successfully", data: termAndCondition })
            } else {
                return res.status(200).json({ status: 200, message: "Don't have any data in Term and condition", })

            }

        } catch (err) {
            return res.status(401).json({ status: 401, message: err.message })
        }
}





