var createError = require('http-errors');
const compression = require('compression');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/userRouter');
const categoryRouter = require('./routes/categoryRouter');
const contentRouter = require('./routes/contentRouter');
const chatRouter = require('./routes/chatRouter');
const messageRouter = require('./routes/messageRouter');
const aboutAndPrivacyRouter = require('./routes/aboutAndPrivacyRouter');
const bannerRouter = require('./routes/bannerRouter');
const ratingRouter = require('./routes/ratingRouter');
const wishlistRouter = require('./routes/wishlistRouter');
const subscribeRouter = require('./routes/subscriptionRouter');
const questionRouter = require('./routes/questionRouter');
const answerRouter = require('./routes/answerRouter');
const paymentRouter = require('./routes/paymentRouter');
const notificationRouter = require('./routes/notificationRouter');
const mySubscriptionRouter = require('./routes/mySubscriptionRouter');
const reportRouter = require('./routes/reportRouter');

var app = express();

// Connect to the MongoDB database
mongoose.connect(process.env.MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: false,
});

// Enable CORS
app.use(cors(
  {
    origin: "*",
    optionsSuccessStatus: 200
  }
));

//making public folder static for publicly access
app.use(express.static('public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Use compression middleware
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/contents', contentRouter);
app.use('/api', aboutAndPrivacyRouter);
app.use("/api", bannerRouter);
app.use("/api", wishlistRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/subscribe", subscribeRouter);
app.use("/api/question", questionRouter);
app.use("/api/answer", answerRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/my-subscription", mySubscriptionRouter);
app.use("/api/report", reportRouter);


app.get('/api/test', (req, res) => {
  res.send('Hello World!Hiiiiii!Helooooooo');
});

// app.use("/api", socketRouter);

app.use('/public/image', express.static(__dirname + '/public/image/'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    // If headers have already been sent, do nothing further
    return next('Something went wrong'); // You can choose the message you want to send.
  }

  if (error.message) {
    console.error("Error:", error.message);
    return res.status(500).send(error.message);
  } else {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || "error";
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message || 'There was an error!',
    });
  }
});


app.use((err, req, res, next) => {
  //console.error("error tushar",err.message);
  res.status(500).json({ message: err.message });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(500).json({ message: err.message });
  // res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
