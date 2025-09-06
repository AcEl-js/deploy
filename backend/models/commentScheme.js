const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const ReactionSchema = new mongoose.Schema({
  user_id: { 
    type: ObjectId, 
    required: true 
  },
  type: {
    type: String,
    enum: ['like', 'dislike'],
    required: true
  }
});

const CommentSchema = new mongoose.Schema({
  comment_id: {
    type: ObjectId,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId()
  },
  user_id: {
    type: ObjectId,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  post_id: {
    type: String,
    required: true
  },
  user_profile_picture_url: String,
  comment_text: {
    type: String,
    required: true
  },
  tags: { 
    type: String,
    default: false, 
    default: '' 
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  parent_comment_id: {
    type: ObjectId,
    default: null
  },
  likes: { 
    type: Number, 
    default: 0 
  },
  dislikes: { 
    type: Number, 
    default: 0 
  },
  attachments: [],
  reactions: [ReactionSchema],
  status: {
    type: String,
    enum: ['active', 'deleted', 'reported', 'flagged'], // Added 'flagged' status
    default: 'active'
  },
  containsUrls: {
    type: Boolean,
    default: false
  },
  isSpoiler: {
    type: Boolean,
    default: false
  },
  edited_timestamp: {
    type: Date,
    default: null
  }
});

// Add a self-reference to allow nested comments
CommentSchema.add({
  replies: [CommentSchema]
});

module.exports = mongoose.model('Comment', CommentSchema);