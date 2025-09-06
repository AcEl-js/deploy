
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');

const authorizationUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  
  

  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  try {
    const decodedToken = jwt.verify(token, 'D130PAnutert0611');
    const userId = decodedToken.id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId, { email: 1, name: 1 });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = {
      _id: userId,
      username: user.name || user.email,
    };
   
    

    // Call next to proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = authorizationUser;
