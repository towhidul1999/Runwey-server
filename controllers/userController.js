const createError = require('http-errors');
const useragent = require('express-useragent');
const bcrypt = require('bcryptjs');
const response = require("../helpers/response");
const User = require("../models/User");
const { createJSONWebToken } = require('../helpers/jsonWebToken');
const { emailData } = require('../helpers/prepareEmail');
const emailWithNodemailer = require('../helpers/email');
const Question = require('../models/questionModel');
const Subscribe = require('../models/subscribeSchema');
const Activities = require('../models/Activities');
// const MySubscription = require('../models/MySubscription');
const Notification = require('../models/Notification');
const MySubscription = require('../models/MySubscription');
const Video = require('../models/Content');
const Wishlist = require('../models/wishlistSchema');

//Sign up user
// const signUp = async (req, res, next) => {
//   try {
//     const { fullName, email, password, dateOfBirth, gender, phoneNumber } = req.body;
//     console.log(req.body.password.length)

//     if (password.length < 8) {
//       return res.status(400).json(response({ statusCode: 400, message: 'Password must be at least 8 characters long', status: "Failed" }));
//     }

//     // Check required fields
//     if (!fullName || !email || !password || !gender || !dateOfBirth || !phoneNumber) {
//       return res.status(400).json(response({ statusCode: 400, message: 'Please fill all fields', status: "Failed" }));

//     }

//     // check if the user exists
//     const userExists = await User.findOne({ email });
//     console.log(userExists)
//     if (userExists) {
//       return res.status(409).json(response({ statusCode: 409, message: 'User already exists', status: "Failed" }));
//       //  return res.redirect('/signup');
//     }

//     // create a new user
//     const user = await User.create({
//       fullName,
//       email,
//       password,
//       gender,
//       dateOfBirth,
//       phoneNumber,
//     });
//     //response
//     res.status(201).json(response({ statusCode: 201, message: 'User created successfully', status: "OK", data: user, type: "user" }));
//   } catch (error) {
//     console.log(error);
//     next(createError(response({ statusCode: 500, message: 'Internel server error', status: "Failed" })));
//   }
// };


// //Signup user
// const signUp = async (req, res) => {
//   try {
//     const { fullName, email, password, dateOfBirth, gender, phoneNumber, countryCode } = req.body;

//     console.log(req.body);

//     // Check if the user already exists
//     const userExist = await User.findOne({ email });
//     if (userExist) {
//       return res.status(409).json({ message: 'User already exists! Please login' });
//     }

//     // Generate OTC (One-Time Code)
//     const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

//     // Create the user in the database
//     const user = await User.create({
//       fullName,
//       email,
//       phoneNumber,
//       countryCode,
//       password,
//       dateOfBirth,
//       gender,
//       oneTimeCode,
//       subcriptionType: "Regular"
//     });

//     // Retrieve user._id for MySubscription
//     const userId = user._id;
//     console.log("------------------->>>>>>>>>>>>>>", userId);
//     const subcriptionId = await Subscribe.findOne({ type: "Regular" })
//     // Create MySubscription using userId
//     await MySubscription.create({
//       subcriptionType: "Regular",
//       userId: userId,
//       expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//       startDate: new Date(),
//       subscriptionId: subcriptionId._id, // You can use userId here if needed
//     })

//     // Prepare email for activate user
//     const emailData = {
//       email,
//       subject: 'Account Activation Email',
//       html: `
//         <h1>Hello, ${user.fullName}</h1>
//         <p>Your One Time Code is <h3>${oneTimeCode}</h3> to reset your password</p>
//         <p>Please click on the following link to <a href='${process.env.CLIENT_URL}/api/user/activate'>activate your account</a></p>
//         <small>This Code is valid for 3 minutes</small>
//         `
//     }

//     // Send email
//     try {
//       emailWithNodemailer(emailData);
//       res.status(201).json({ message: 'Thanks! Please check your E-mail to verify.' });
//     } catch (emailError) {
//       console.error('Failed to send verifiaction email', emailError);
//     }

//     // Set a timeout to update the oneTimeCode to null after 1 minute
//     setTimeout(async () => {
//       try {
//         user.oneTimeCode = null;
//         await user.save();
//         console.log('oneTimeCode reset to null after 3 minutes');
//       } catch (error) {
//         console.error('Error updating oneTimeCode:', error);
//       }
//     }, 180000); // 3 minutes in milliseconds

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ message: 'Error creating user', error });
//   }
// };

const signUp = async (req, res) => {
  try {
    const { fullName, email, password, dateOfBirth, gender, phoneNumber, countryCode } = req.body;

    // Check if the user already exists
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(409).json({ message: 'User already exists! Please login' });
    }

    // Generate OTC (One-Time Code)
    const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    // Create the user in the database
    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      countryCode,
      password,
      dateOfBirth,
      gender,
      oneTimeCode,
      subcriptionType: "Regular"
    });

    // Retrieve user._id for MySubscription
    const userId = user._id;

    // Create MySubscription using userId
    const subcriptionId = await Subscribe.findOne({ type: "Regular" });
    await MySubscription.create({
      subcriptionType: "Regular",
      userId: userId,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      startDate: new Date(),
      subscriptionId: subcriptionId._id,
    });

    // Prepare email for activate user
    const emailData = {
      email,
      subject: 'Account Activation Email',
      html: `
        <h1>Hello, ${user.fullName}</h1>
        <p>Your One Time Code is <h3>${oneTimeCode}</h3> to reset your password</p>
        <p>Please click on the following link to <a href='${process.env.CLIENT_URL}/api/user/activate'>activate your account</a></p>
        <small>This Code is valid for 3 minutes</small>
        `
    }

    // Send email
    try {
      emailWithNodemailer(emailData);

      // Create a new activity document for signUp
      const signUpActivity = new Activities({
        userId: user._id,
        device: req.headers['user-agent'],
        browser: useragent.parse(req.headers['user-agent']).browser,
        ip: req.ip,
        timestamp: Date.now(),
      });

      // Save the signUp activity to the activities collection
      await signUpActivity.save();

      // Generate access token
      const expiresInOneYear = 365 * 24 * 60 * 60; // seconds in 1 year
      const accessToken = createJSONWebToken({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY, expiresInOneYear);

      // Success response with access token
      res.status(201).json({
        message: 'Thanks! Please check your E-mail to verify.',
        token: accessToken,
        type: "user",
      });
    } catch (emailError) {
      console.error('Failed to send verification email', emailError);
      res.status(500).json({ message: 'Error creating user', error: emailError });
    }

    // Set a timeout to update the oneTimeCode to null after 1 minute
    setTimeout(async () => {
      try {
        user.oneTimeCode = null;
        await user.save();
        console.log('oneTimeCode reset to null after 3 minutes');
      } catch (error) {
        console.error('Error updating oneTimeCode:', error);
      }
    }, 180000); // 3 minutes in milliseconds

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating user', error });
  }
};

//Sign in user
const signIn = async (req, res, next) => {
  try {
    // Get email and password from req.body
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    console.log(user)

    if (!user) {
      return res.status(404).json(response({ statusCode: 404, message: 'User not found', status: "Failed" }));
    }

    // Check if the user is banned
    if (user.isBanned) {
      return res.status(401).json(response({ statusCode: 401, message: 'You are banned', status: "Failed" }));
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("---------------", isPasswordValid)

    if (!isPasswordValid) {
      return res.status(401).json(response({ statusCode: 401, message: 'Authentication failed', status: "Failed" }));
    }

    // Get user agent information
    const userAgentInfo = useragent.parse(req.headers['user-agent']);
    console.log(userAgentInfo);

    // Create a new activity document
    const loginActivity = new Activities({
      userId: user._id, // Assuming you store user ID in activities
      device: userAgentInfo.source,
      browser: userAgentInfo.browser,
      ip: req.ip,
      timestamp: Date.now(),
    });

    // Save the login activity to the activities collection
    await loginActivity.save();

    const expiresInOneYear = 365 * 24 * 60 * 60; // seconds in 1 year
    const accessToken = createJSONWebToken({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY, expiresInOneYear);
    console.log(accessToken);

    //Success response
    res.status(200).json(response({ statusCode: 200, message: 'Authentication successful', status: "OK", data: user, token: accessToken, type: "user" }));


  } catch (error) {
    console.log(error.message);
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};


//Process forgot password
const processForgetPassword = async (req, res, next) => {
  console.log(req.body.email)
  try {
    const { email } = req.body;


    // Check if the user already exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(response({ statusCode: 404, message: "User not found", status: "Failed", type: 'user' }));
    }

    // Generate OTC (One-Time Code)
    const oneTimeCode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    // Store the OTC and its expiration time in the database
    user.oneTimeCode = oneTimeCode;
    await user.save();

    // Send email
    try {
      await emailWithNodemailer(emailData(email, user.fullName, oneTimeCode));
    } catch (emailError) {
      console.error('Failed to send verification email', emailError);
    }

    // Set a timeout to update the oneTimeCode to null after 1 minute
    setTimeout(async () => {
      try {
        user.oneTimeCode = null;
        await user.save();
        console.log('oneTimeCode reset to null after 3 minute');
      } catch (error) {
        console.error('Error updating oneTimeCode:', error);
      }
    }, 180000); // 3 minute in milliseconds

    res.status(201).json(response({ message: 'Thanks! Please check your email to reset password', status: "OK", statusCode: 200 }));
  } catch (error) {
    console.log(error.message);
    res.status(500).json(response({ message: 'Error processing forget password', statusCode: 500, status: "Failed" }));
  }
};

//verify one time code
const verifyOneTimeCode = async (req, res) => {
  try {
    const requestType = !req.query.requestType ? 'resetPassword' : req.query.requestType;
    const { oneTimeCode, email } = req.body;
    console.log(req.body.oneTimeCode);
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(response({ message: 'User does not exist', status: "Failed", statusCode: 404 }));
    } else if (user.oneTimeCode === oneTimeCode) {
      if (requestType === 'resetPassword') {
        user.oneTimeCode = 'verified';
        await user.save();
        res.status(200).json(response({ message: 'One Time Code verified successfully', type: "reset-forget password", status: "OK", statusCode: 200, data: user }));
      }
      else if (requestType === 'verifyEmail' && user.oneTimeCode !== null && user.emailVerified === false) {
        console.log('email verify---------------->', user)
        user.emailVerified = true;
        user.oneTimeCode = null;
        await user.save();
        const subscription = await Subscribe.findOne({ type: 'Regular' });
        if (subscription) {
          await MySubscription.create({
            userId: user._id,
            subscriptionId: subscription._id,
            expiryDate: new Date(),
            subscriptionType: "Regular",
          });
        }
        //const accessToken = createJSONWebToken({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET_KEY, expiresInOneYear);
        //console.log(accessToken);
        res.status(200).json(response({ message: 'Email verified successfully', status: "OK", type: "email verification", statusCode: 200, data: user }));
      }
      else {
        res.status(409).json(response({ message: 'Request type not defined properly', status: "Error", statusCode: 409 }));
      }
    }
    else if (user.oneTimeCode === null) {
      res.status(410).json(response({ message: 'One Time Code has expired', status: "failed", statusCode: 410 }));
    }
    else {
      res.status(400).json(response({ message: 'Invalid OTC', status: "OK", statusCode: 200 }));
    }
  } catch (error) {
    res.status(500).json(response({ message: 'Error verifying OTC', status: "failed", statusCode: 500 }));
  }
};

//Update password without login
const updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json(response({ message: 'User does not exist', status: "Failed", statusCode: 404 }));
    }
    if (user.oneTimeCode === 'verified') {
      user.password = password;
      user.oneTimeCode = null;
      await user.save();
      res.status(200).json(response({ message: 'Password updated successfully', status: "OK", statusCode: 200 }));
    }
    else {
      res.status(200).json(response({ message: 'Something went wrong, try forget password again', status: "Failed", statusCode: 400 }));
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json(response({ message: 'Error updating password', status: "Failed", statusCode: 500 }));
  }
};

async function changePasword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json(response({ message: 'User not found', status: "Failed", statusCode: 404 }));
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(response({ message: 'Invalid old password', status: "Failed", statusCode: 400 }));
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json(response({ message: 'Password updated successfully', status: "OK", statusCode: 200 }));
  } catch (error) {
    console.log(error.message);
    return next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

const profileData = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    console.log(user);
    return res.status(200).json({ status: 200, data: user });
  } catch (error) {
    next(createError(response({ statusCode: 500, message: 'Internel server error', status: "Failed" })));
  }
};

const allRequestedUser = async (req, res, next) => {
  try {
    const validUser = await User.findById(req.body.userId);
    if (validUser.role !== 'admin') {
      return res.status(400).json(response({ message: 'You are not authorized', status: "Bad Request", statusCode: 400 }));
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const users = await User.find({ role: 'pendingCreator' })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.countDocuments({ role: 'pendingCreator' });

    if (!users) {
      return res.status(404).json({ message: 'Users not found' });
    }

    return res.status(200).json({
      message: "Requested users",
      type: "User",
      statusCode: 200,
      status: "Okay",
      data: users,
      pagination: {
        totalDocuments: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    });
  } catch (error) {
    console.error(error.message);
    next(createError(response({ statusCode: 500, message: 'Internal server error', status: "Failed" })));
  }
};

const updateProfile = async (req, res, next) => {
  console.log('profile called------->', req.body, req.fileName);
  let { fullName, phoneNumber, countryCode, gender, dateOfBirth } = req.body;

  try {
    const user = await User.findById(req.body.userId);

    if (!user) {
      return res.status(404).json(response({
        message: 'You are not authorized',
        status: 'Failed',
        statusCode: 404,
      }));
    }

    // Validation logic (add your own validation checks)
    if (typeof fullName !== 'string' || typeof phoneNumber !== 'string' || typeof countryCode !== 'string') {
      return res.status(400).json(response({
        message: 'Invalid input data',
        status: 'Failed',
        statusCode: 400,
      }));
    }

    const updatedUser = {
      fullName: !fullName ? user.fullName : fullName,
      phoneNumber: !phoneNumber ? user.phoneNumber : phoneNumber,
      countryCode: !countryCode ? user.countryCode : countryCode,
      dateOfBirth: !dateOfBirth ? user.dateOfBirth : dateOfBirth,
      gender: !gender ? user.gender : gender
    };
    console.log("fhskdjhfikjhklgjhkjhkjgh", req.fileName)
    if (req.fileName) {
      const originalFileName = req.fileName;
      const publicFileUrl = `/images/${originalFileName}`;

      const fileInfo = {
        publicFileUrl,
        path: `public/images/${originalFileName}`,
      };

      updatedUser.image = fileInfo;
      user.image = fileInfo;
      await user.save();
    }

    const updatedUserProfile = await User.findByIdAndUpdate(req.body.userId, updatedUser, { new: true });
    console.log(updatedUserProfile);

    return res.status(200).json(response({
      message: 'Profile updated successfully',
      type: 'User',
      statusCode: 200,
      status: 'Okay',
      data: updatedUserProfile,
    }));
  } catch (error) {
    console.log(error.message);
    console.error('Error updating profile:', error);
    next(createError(response({
      statusCode: 500,
      message: error.message,
      status: 'Failed',
    })));
  }
};

const userToCreator = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);
    const user = await User.findById(userId);
    user.role = 'creator';
    await user.save();
    const notification = new Notification({
      message: `You request has been accepted of being a creator`,
      type: "userToCreator",
      role: "user",
      receiverId: req.params.id,
    });

    await notification.save();
    const roomId = `user-notification::${req.params.id}`;
    io.emit(roomId, notification);
    return res.status(200).json(response({ message: 'User converted to creator successfully', status: "OK", statusCode: 200, type: 'user' }));
  } catch (error) {
    console.error(error.message);
    res.status(500).json(response({ message: 'Error converting user to creator', status: "Failed", statusCode: 500 }));
  }
};

const userDetails = async (req, res) => {
  try {
    // Get total users
    const allUsers = await User.find({});
    const totalUsersCount = allUsers.length;

    // Get total users subscribed to standard plan
    const standardUsers = await User.find({ subcriptionType: 'Standard' });
    const standardUsersCount = standardUsers.length;

    // Get total users subscribed to free plan
    const regularUsers = await User.find({ subcriptionType: 'Regular' });
    const regularUsersCount = regularUsers.length;

    // Get total users subscribed to premium plan
    const premiumUsers = await User.find({ subcriptionType: 'Premium' });
    const premiumUsersCount = premiumUsers.length;

    console.log('Total Users:', totalUsersCount);
    console.log('Standard Users:', standardUsersCount);
    console.log('Free Users:', regularUsersCount);

    // You can send the counts as a response or perform further actions as needed
    res.status(200).json(response({
      message: 'Total users fetched successfully',
      type: 'User',
      statusCode: 200,
      status: 'Okay',
      data: [
        {
          users: "Total Users",
          count: totalUsersCount
        },
        {
          users: "Standard Users",
          count: standardUsersCount
        },
        {
          users: "Regular Users",
          count: regularUsersCount
        }
      ]
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const allUsers = async (req, res) => {
//   try {
//     const search = req.query.search || '';
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;
//     const searchRegExp = new RegExp('.*' + search + '.*', 'i');
//     const filter = {
//       $or: [{ subcriptionType: { $regex: searchRegExp } }],
//     };
//     const options = { password: 0 };

//     const perMittedUser = await User.findById(req.body.userId);
//     const usersQuery = search === 'all' ? {} : { subcriptionType: search };

//     const users = await User.find(usersQuery, options)
//       .sort
//       .limit(limit)
//       .skip((page - 1) * limit);
//     const count = await User.countDocuments(usersQuery);

//     if (!users) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({
//       users,
//       pagination: {
//         totalDocuments: count,
//         totalPage: Math.ceil(count / limit),
//         currentPage: page,
//         previousPage: page - 1 > 0 ? page - 1 : null,
//         nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Error retrieving users', error });
//   }
// };

const allUsers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    const filter = {
      $or: [
        { subcriptionType: { $regex: searchRegExp } },
        { role: { $regex: searchRegExp } },
      ],
    };
    const options = { password: 0 };

    const perMittedUser = await User.findById(req.body.userId);

    let usersQuery;
    if (search === 'all') {
      usersQuery = {};
    } else {
      usersQuery = {
        $or: [
          { subcriptionType: searchRegExp },
          { role: searchRegExp },
        ],
      };
    }

    const users = await User.find(usersQuery, options)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(usersQuery);

    if (!users) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      users,
      pagination: {
        totalDocuments: count,
        totalPage: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error retrieving users', error });
  }
};

const pendingCreator = async (req, res) => {
  try {
    const validUser = await User.findById(req.body.userId);
    if (validUser.role !== 'admin') {
      return res.status(400).json(response({ message: 'You are not authorized', status: "Bad Request", statusCode: 400 }));
    }
    const user = await User.findById({ _id: req.params.id, role: 'pendingCreator' });
    return res.status(200).json(response({ message: "Requested users", type: "User", statusCode: 200, status: "Okay", data: user }));
  } catch (error) {
    return res.status(500).json({ message: 'Error converting user to creator', error });
  }

};

const pendingCreatorToCreator = async (req, res) => {
  try {
    const validUser = await User.findById(req.body.userId);
    // const user = await User.findById(req.params.id);
    if (!validUser) {
      return res.status(404).json({ message: 'You are not permited' });
    }
    if (validUser.role === 'admin') {
      const user = await User.find();
    }

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Error converting user to creator', error });
  }
};

const cancelCreatorRequest = async (req, res) => {
  try {
    const validUser = await User.findById(req.body.userId);

    if (!validUser) {
      return res.status(404).json(response({ message: 'User not found', status: 'Not Found', statusCode: 404 }));
    }

    if (validUser.role !== 'admin') {
      return res.status(400).json(response({ message: 'You are not authorized', status: 'Bad Request', statusCode: 400 }));
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role: 'user' }, { new: true });

    return res.status(200).json(response({ message: 'Requested users', type: 'User', statusCode: 200, status: 'Okay', data: user }));
  } catch (error) {
    console.log("iuyiiiuiuyiouyiuy", error.message);
    return res.status(500).json({ message: 'Error converting user to creator', error });
  }
};

const genderRatio = async (req, res) => {
  try {
    const validUser = await User.findById(req.body.userId);
    if (validUser.role !== 'admin') {
      return res.status(400).json(response({ message: 'You are not authorized', status: "Bad Request", statusCode: 400 }));
    }

    const users = await User.find();
    const totalUsers = users.length;

    const maleCount = users.filter(user => user.gender === 'Male').length;
    const femaleCount = users.filter(user => user.gender === 'Female').length;
    const otherCount = users.filter(user => user.gender === 'Other').length;

    const genderRatio = {
      maleCount,
      femaleCount,
      otherCount,
      totalUsers,
      malePercentage: (maleCount / totalUsers) * 100,
      femalePercentage: (femaleCount / totalUsers) * 100,
      otherPercentage: (otherCount / totalUsers) * 100,
    };

    return res.status(200).json(response({ message: "Gender ratio", type: "User", statusCode: 200, status: "Okay", data: genderRatio }));
  } catch (error) {
    console.error(error);
    return res.status(500).json(response({ message: "Internal Server Error", statusCode: 500, status: "Failed" }));
  }
};

const getLoginActivities = async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId);
    console.log(user._id);
    if (user._id.toString() !== userId || user.role !== 'admin') {
      return res.status(404).json({ message: 'You are not authorized' });
    }
    const loginActivities = await Activities.find();

    res.status(200).json(response({ message: "Login activities", type: "User", statusCode: 200, status: "Okay", data: loginActivities }));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error retrieving login activities' });
  }

};

const bannedUser = async (req, res) => {
  try {
    const password = req.body.password;
    console.log("-----------.........", password);
    const loggedInUser = await User.findById(req.body.userId);
    console.log(loggedInUser);
    const isPasswordValid = await bcrypt.compare(password, loggedInUser.password);
    console.log(isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json(response({ message: 'Invalid password', status: "Unauthorized", statusCode: 401 }));
    }

    // Update the user's status to banned
    const user = await User.findByIdAndUpdate(req.body.userId, { isBanned: true }, { new: true });
    return res.status(200).json(response({ message: "User banned successfully", type: "User", statusCode: 200, status: "OK", data: user }));

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error banning user', error });
  }
};

const swapUserRole = async (req, res) => {
  try {
    const swapValue = req.body.swapValue;
    const userId = req.params.userId;
    const adminId = req.body.userId;
    const admin = await User.findById(userId);
    const user = await User.findById(userId);
    const video = await Video.deleteMany({ userId: userId });
    const wishlist = await Wishlist.deleteMany({ userId: userId });

    if (!user) {
      return res.status(404).json(response({ message: 'User not found' }));
    };
    if (admin.role !== 'admin') {
      return res.status(400).json(response({ message: 'You are not authorized' }));
    }

    user.role = swapValue;

    user.save();
    res.status(200).json(response({ message: "User role swapped successfully", type: "User", statusCode: 200, status: "OK", data: user }));
    console.log(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Error swapping user role' });
  }
};

module.exports = {
  signUp,
  signIn,
  processForgetPassword,
  verifyOneTimeCode,
  updatePassword,
  profileData,
  userToCreator,
  userDetails,
  allUsers,
  allRequestedUser,
  pendingCreatorToCreator,
  updateProfile,
  pendingCreator,
  genderRatio,
  changePasword,
  getLoginActivities,
  cancelCreatorRequest,
  bannedUser,
  swapUserRole
};