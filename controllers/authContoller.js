import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import farmerModel from "../models/farmerModel.js";
// Farmer Registration
export const farmerRegister = catchAsyncError(async (req, res, next) => {
  try {
    const farmerExists = await farmerModel.findOne({ email: req.body.email }); // Use farmernModel
  if (farmerExists) {
    return next(new ErrorHandler("User already exists", 401));
  }

  const password = req.body.password;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  req.body.password = hashedPassword;

  const newFarmer = new farmerModel(req.body); // Use farmernModel

  const token = jwt.sign({ id: newFarmer._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const savedFarmer = await newFarmer.save(); // Save using farmernModel
  res.status(201).send({
    message: "User account created successfully",
    success: true,
    token: token,
    user: savedFarmer,
  });
  } catch (error) {
    console.log("Error during register the user:", error); // Log the full error

    // Handle known error types (e.g., validation errors) and send a response
    if (error instanceof ErrorHandler) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Generic error handler for unexpected errors
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message || error,
    });
  }
});

// Farmer Login
export const farmerLogin = catchAsyncError(async (req, res, next) => {
  const farmer = await farmerModel.findOne({ email: req.body.email }); // Use farmernModel

  if (!farmer) {
    return next(new ErrorHandler("User does not exist", 401));
  }

  const isMatch = bcrypt.compareSync(req.body.password, farmer.password);

  if (!isMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const token = jwt.sign({ id: farmer._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.status(200).send({
    message: "Login successful",
    success: true,
    token: token,
    user: farmer,
  });
});

// Update Profile
export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { firstName, lastName, email, phone, profilePic } = req.body;

  const farmer = await farmerModel.findById(req.user.id); // Use farmernModel

  if (!farmer) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Update the profile fields only if they are provided
  if (firstName) farmer.firstname = firstName;
  if (lastName) farmer.lastname = lastName;
  if (email) farmer.email = email;
  if (phone) farmer.mobile = phone;
  if (profilePic) farmer.avatar = profilePic;

  // Save the updated farmer profile
  await farmer.save();

  res.status(200).json({
    message: "Profile updated successfully",
    success: true,
    user: farmer,
  });
});
