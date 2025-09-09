const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
require('dotenv').config();

const storage = multer.memoryStorage();
const upload = multer({ storage });
const ObjectId = mongoose.Types.ObjectId;

const AuthControler = require('./controllers/controlleUser');
const authorizationUser = require('./middleware/requiredUser');
const authorizationUserAuth = require('./middleware/requiredAuth');
const commentController = require('./controllers/controlleComment');

const app = express();

const corsOptions = {
  origin: ['https://sync-homie.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const connectDB = async () => {
  const uri = process.env.MONGODB_CONNECT_URL;
  console.log(uri);
  
  if (!uri) {
    console.error('Error: MONGODB_CONNECT_URL is not defined in .env file.');
    process.exit(1);
  }

  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log('Connected to MongoDB');
      break;
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      if (retries === 0) {
        console.error('Could not connect to MongoDB after multiple attempts');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
};

connectDB();

// Routes
app.get('/check-auth', authorizationUserAuth);
app.get('/comments/:post_id', commentController.getComments);
app.get('/user-info', AuthControler.getuserInfo);
app.get('/logout', AuthControler.logoutUser);
app.get('/check-community-rules/:userId', authorizationUser, AuthControler.checkCommunityRules);
app.post('/agree-to-rules', authorizationUser, AuthControler.agreeToCommunityRules);
app.post('/api/createUser', AuthControler.createAccount);
app.post('/api/login', AuthControler.login);
app.post('/comments', authorizationUser, commentController.createComment);
app.post('/comments/:commentId/like', authorizationUser, commentController.handleLike);
app.post('/comments/:commentId/dislike', authorizationUser, commentController.handleDislike);
app.delete('/deleteComment', commentController.deleteComment);

app.listen(8080, () => {
  console.log('you are listening on port 8080');
});