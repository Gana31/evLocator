import Jwt from 'jsonwebtoken'
import ErrorHandler from '../utils/errorHandler.js';
import farmerModel from '../models/farmerModel.js';

// Middleware to authenticate the user using JWT token
export async function auth(req, res, next) {
  let token = req.header('Authorization');
  // Check if token exists and split the string to remove 'Bearer'
  if (token && token.startsWith('Bearer ')) {
   
    token = token.split(' ')[1]; // This will get the actual token part
  } else {
    return next(new ErrorHandler('Invalid token format', 401));
  }

  if (!token) {
    return next(new ErrorHandler('No token provided', 401));
  }

  try {
    // Verify the token
    const decodedToken = Jwt.verify(token, process.env.JWT_SECRET);

    // Find the user using the decoded token's ID
    const user = await farmerModel.findById(decodedToken.id);

    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    // Add user info to the request object for access in subsequent middlewares
    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler('Invalid token', 401));
  }
}


// Middleware to check if the user is an admin
export async function isAdmin(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await farmerModel.findById(userId).select('+password');  // Using correct model here

    if (!user) {
      return next(new ErrorHandler('Invalid token. User not found.', 401));
    }

    if (user.role !== 'admin') {
      return next(new ErrorHandler('Restricted.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new ErrorHandler('Unauthorized.', 401));
  }
}
