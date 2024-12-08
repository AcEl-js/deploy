const  Comment= require('../models/commentScheme');
const User = require('../models/userSchema');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const db = mongoose.connection;

const URL_REGEX = /https?:\/\/[^\s]+/gi;



async function createComment(req, res) {
  try {
    const {
      comment_text,
      post_id,
      parent_comment_id = null,
      isSpoiler = false,
    } = req.body;

    // Validate required fields
    if (!comment_text || !post_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for URLs in the comment
    const hasUrls = comment_text.match(URL_REGEX);
    const commentStatus = hasUrls ? 'flagged' : 'active';

    const newComment = new Comment({
      user_id: req.user._id,
      username: req.user.username,
      comment_text,
      post_id,
      parent_comment_id,
      isSpoiler,
      user_profile_picture_url: null,
      status: commentStatus, // New status field
      likes: 0,
      dislikes: 0,
      timestamp: new Date(),
      edited_timestamp: null,
      // Add a new field to track URL detection
      containsUrls: !!hasUrls
    });

    await newComment.save();

    // If comment contains URLs, you might want to log it for review
    if (hasUrls) {
      console.log(`Comment with URL flagged: ${newComment._id}`);
      // Optionally, you could add additional logging or notification logic here
    }

    res.status(201).json({ 
      message: hasUrls ? 'Comment flagged for review' : 'Comment added successfully', 
      comment: newComment 
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
}

// Modify getComments to filter out flagged comments
async function getComments(req, res) {
  try {
    const { post_id } = req.params;
     let userId
    
    if (req.headers.authorization?.split(' ')[1]!="null") {
     userId= req.headers.authorization?.split(' ')[1]
    }


    // Fetch comments with special handling for flagged comments
    const comments = await Comment.find({ 
      post_id,
      $or: [
        { status: 'active' },
        { 
          status: 'flagged', 
          user_id: userId // Only show flagged comments to their original author
        }
      ]
    }).sort({ timestamp: -1 });

    // Create a map to store comments by their `comment_id`
    const commentMap = {};
    comments.forEach((comment) => {
      commentMap[comment.comment_id] = { 
        ...comment.toObject(), 
        replies: [], 
        depth: 0,
        // Add a flag to indicate if comment is visible only to the author
        isAuthorOnly: comment.status === 'flagged'
      }; 
    });

    // Build the tree structure
    const commentTree = [];
    comments.forEach((comment) => {
      if (comment.parent_comment_id) {
        // If the comment is a reply, add it to its parent's replies
        const parent = commentMap[comment.parent_comment_id];
        if (parent) {
          const currentDepth = parent.depth + 1;
          commentMap[comment.comment_id].depth = currentDepth;
          parent.replies.push(commentMap[comment.comment_id]);
        }
      } else {
        // If it's a top-level comment, add it to the tree
        commentTree.push(commentMap[comment.comment_id]);
      }
    });

    // Sort replies for each comment by likes in descending order
    Object.values(commentMap).forEach((comment) => {
      if (comment.replies.length > 0) {
        comment.replies.sort((a, b) => b.likes - a.likes);
      }
    });

    res.json(commentTree);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
}


  



const handleLike = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;
   
    

    // Find the comment
    const comment = await Comment.findOne({ comment_id: commentId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has already reacted
    const existingReaction = comment.reactions.find(
      reaction => reaction.user_id.toString() === userId.toString()
    );

    if (!existingReaction) {
      // No existing reaction - add new like
      comment.reactions.push({
        user_id: userId,
        type: 'like'
      });
      comment.likes += 1;
      await comment.save();
      
      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'like'
      });
    }

    if (existingReaction.type === 'like') {
      // Remove existing like
      comment.reactions = comment.reactions.filter(
        reaction => reaction.user_id.toString() !== userId.toString()
      );
      comment.likes -= 1;
      await comment.save();

      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'none'
      });
    }

    if (existingReaction.type === 'dislike') {
      // Change dislike to like
      existingReaction.type = 'like';
      comment.likes += 1;
      comment.dislikes -= 1;
      await comment.save();

      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'like'
      });
    }
  } catch (error) {
    console.error('Like handler error:', error);
    res.status(500).json({ message: 'Error processing like', error: error.message });
  }
};


const handleDislike = async (req,res)=> {
  try {
    const commentId = req.params.commentId;

    
    const userId = req.user._id;

    // Find the comment
    const comment = await Comment.findOne({ comment_id: commentId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user has already reacted
    const existingReaction = comment.reactions.find(
      reaction => reaction.user_id.toString() === userId.toString()
    );

    if (!existingReaction) {
      // No existing reaction - add new dislike
      comment.reactions.push({
        user_id: userId,
        type: 'dislike'
      });
      comment.dislikes += 1;
      await comment.save();
      
      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'dislike'
      });
    }

    if (existingReaction.type === 'dislike') {
      // Remove existing dislike
      comment.reactions = comment.reactions.filter(
        reaction => reaction.user_id.toString() !== userId.toString()
      );
      comment.dislikes -= 1;
      await comment.save();

      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'none'
      });
    }

    if (existingReaction.type === 'like') {
      // Change like to dislike
      existingReaction.type = 'dislike';
      comment.likes -= 1;
      comment.dislikes += 1;
      await comment.save();

      return res.json({
        likes: comment.likes,
        dislikes: comment.dislikes,
        userInteraction: 'dislike'
      });
    }
  } catch (error) {
    console.error('Dislike handler error:', error);
    res.status(500).json({ message: 'Error processing dislike', error: error.message });
  }
}

async function getUserReaction(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await Comment.findOne({ comment_id: commentId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const existingReaction = comment.reactions.find(
      reaction => reaction.user_id.toString() === userId.toString()
    );

    return res.json({
      likes: comment.likes,
      dislikes: comment.dislikes,
      userInteraction: existingReaction ? existingReaction.type : 'none'
    });
  } catch (error) {
    console.error('Get reaction error:', error);
    res.status(500).json({ message: 'Error getting reaction state', error: error.message });
  }
}



// Delete a comment
async function deleteComment(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Comment ID is required' });
    }

    const deletedComment = await Comment.findByIdAndDelete(id);

    if (!deletedComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({ success: 'Comment deleted successfully', comment: deletedComment });
  } catch (err) {
    console.error('Failed to delete comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

module.exports = {
  createComment,
  getComments,
  handleLike,
  handleDislike,
  getUserReaction,
  deleteComment,

};
