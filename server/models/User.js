import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Guest'
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
