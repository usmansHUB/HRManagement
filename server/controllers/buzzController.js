const BuzzPost = require('../models/BuzzPost');
const sendResponse = require('../utils/apiResponse');

// GET /api/buzz - Get all posts
exports.getPosts = async (req, res, next) => {
  try {
    const posts = await BuzzPost.find()
      .populate('employeeId', 'firstName lastName designation avatar')
      .sort({ createdAt: -1 });
    return sendResponse(res, 200, true, 'Buzz feed posts fetched successfully', posts);
  } catch (error) {
    next(error);
  }
};

// POST /api/buzz - Create post
exports.createPost = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return sendResponse(res, 400, false, 'Post content cannot be empty');
    }

    if (!req.user.employeeId) {
      return sendResponse(res, 400, false, 'Only personnel/employees can submit buzz posts');
    }

    const post = new BuzzPost({
      employeeId: req.user.employeeId,
      text,
      likes: [],
    });

    await post.save();
    
    const populated = await post.populate('employeeId', 'firstName lastName designation avatar');
    return sendResponse(res, 201, true, 'Buzz post published successfully', populated);
  } catch (error) {
    next(error);
  }
};

// POST /api/buzz/:id/like - Like/Unlike post
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await BuzzPost.findById(req.params.id);
    if (!post) {
      return sendResponse(res, 404, false, 'Buzz post not found');
    }

    if (!req.user.employeeId) {
      return sendResponse(res, 400, false, 'Only employees can like buzz posts');
    }

    const employeeId = req.user.employeeId;
    const index = post.likes.indexOf(employeeId);

    if (index === -1) {
      post.likes.push(employeeId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();
    return sendResponse(res, 200, true, 'Post like toggled successfully', post);
  } catch (error) {
    next(error);
  }
};
