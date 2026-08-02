import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Guest'
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // allows multiple docs with no email (guests)
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false // guests have no password; register/login always set one
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;
