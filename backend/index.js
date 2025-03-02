const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const multer = require('multer');


// Configure Multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage:storage });

const ObjectId = mongoose.Types.ObjectId;





const AuthControler=require('./controllers/controlleUser') 
const authorizationUser=require('./middleware/requiredUser')
const authorizationUserAuth=require('./middleware/requiredAuth')
const commentController = require('./controllers/controlleComment');



const Comment = require('./models/commentScheme');

const app = express()



//connect to the database

const corsOptions = {
  origin: ['https://sync-homie.vercel.app', 'http://localhost:3000'], // Array of allowed URLs
  credentials: true, // Allow credentials (cookies) to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Specify allowed headers
};



app.use(cors(corsOptions));
app.use(express.json())
app.use(cookieParser())
require('dotenv').config();
const uri = process.env.MONGODb_CONNECT_URL;
if (!uri) {
  console.error('Error: MONGODb_CONNECT_URL is not defined in .env file.');
  process.exit(1); // Exit the application
}


(async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the application
  }
})();

console.log(uri);





//post request to create a new user q
app.get('/check-auth', authorizationUserAuth)
app.get('/comments/:post_id', commentController.getComments);
app.get('/user-info',AuthControler.getuserInfo)
app.get('/logout', AuthControler.logoutUser)



app.get('/check-community-rules/:userId', authorizationUser, AuthControler.checkCommunityRules);
app.post('/agree-to-rules', authorizationUser, AuthControler.agreeToCommunityRules);



app.post('/api/createUser', AuthControler.createAccount);
app.post('/api/login', AuthControler.login)
app.post('/comments', authorizationUser, commentController.createComment);


app.post('/comments/:commentId/like', authorizationUser,commentController.handleLike)
app.post('/comments/:commentId/dislike', authorizationUser,commentController.handleDislike)
/* app.post('/api/comments/nasted-reaction',commentController.nestedReplyReaction) */



app.delete('/deleteComment',commentController.deleteComment)

app.listen(8080, () => {  console.log('you are listning on port 8080') }) 

