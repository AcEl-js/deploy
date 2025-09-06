const User = require('../models/userSchema');
const jwt = require('jsonwebtoken');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const mydata=require('../middleware/requiredUser')

// handel errors

const handelErrors = (err) => {
    const errors = { email: '', password: '' }

    if (err.message === 'incorrect email') {
       
        errors.email = 'This email is not registered';
    }
    if (err.message === 'incorrect password') {
        errors.password = ' The password is incorrect';
    }


    if (err.message.includes('User validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })

    }
    if (err.code === 11000) {
        errors.email = 'email is alerady exist';
    }
    return errors;
}

// create a Jwt token

const maxAge = 3 * 24 * 60 * 60; // the token will expire after 3 days 

const createToken = (id) => {

    return jwt.sign({ id }, 'D130PAnutert0611', {
        expiresIn: maxAge,
    })


}
module.exports.createAccount = async (req, res) => {
    const { name, email, password } = req.body;



    try {
        const user = await User.create({ name, email, password })
        const token = createToken(user._id,user.name);

        res.cookie('jwt', token, {
             httpOnly: true,
             sameSite: 'None',
             secure: process.env.NODE_ENV === 'production',
             maxAge: maxAge * 1000 });
        res.status(200).json({ user: user._id ,msg:`Welcome  ${name} you register successfully  👋`});
    }
    catch (err) {
        let errors = handelErrors(err);
        res.status(500).json(errors);
    }

}
module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.login(email, password);
        const token = createToken(user._id);
       console.log(token,user);
       
        

        // In development, ensure secure is set based on the environment
        res.cookie('jwt', token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: maxAge * 1000
        });


        res.status(200).json({ user: user._id, msg: `Welcome you logged in successfully 👋` });
    } catch (err) {
        let errors = handelErrors(err);
        res.status(500).json(errors);
        console.log(errors);
    }
};

module.exports.getuserInfo = async (req, res) => {
    try {
        const id = req.query.id;  // Get the user ID from query parameters


        const user = await User.findById(new ObjectId(id), {name: 1,_id:1});
    
        
        res.status(200).json(user);

    } catch (error) {
        res.status(500).json(error);
    }
}


module.exports.logoutUser = (req, res) => {
    // Clear the cookie containing the JWT token
   res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0), // Set to past date
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        path: '/'
    });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ message: 'Logged out successfully' });
};


// In your user controller or routes file
module.exports.checkCommunityRules = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ 
            agreedToCommunityRules: user.agreedToCommunityRules 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports.agreeToCommunityRules = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const user = await User.findByIdAndUpdate(
            userId, 
            { agreedToCommunityRules: true }, 
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({ 
            message: 'Successfully agreed to community rules',
            agreedToCommunityRules: true 
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
