const mongoose = require('mongoose');
const {isEmail} = require('validator');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema(
    {
    name: {
        type: String,
        required: [true,'Please enter an First Name'],
       

    },
    email: {
        type: String,
        required: [true,'Please enter an Email'],
        lowercase: true,
        unique: true,
        validate:[isEmail, 'Invalid email']
    },
    password: {
        type: String,
         required:[true,'Please enter an Password'],
         unique: true,
        minlength: [6,'Password should be atleast 6 characters'],
    }


},
{
    collection: 'users',
}
)

userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();

})

userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
        return user;
    }
    throw Error('incorrect password');

}
throw Error('incorrect email');
}




module.exports = mongoose.model('User', userSchema);