const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// Verifies JWT and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Preferred: httpOnly cookie (set by /auth/login) - browser sends this automatically
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // Fallback: Authorization header - useful for Postman testing / non-browser clients
  else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("User no longer exists");
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

module.exports = { protect };
