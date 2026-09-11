// Usage: authorize("doctor", "hospital_admin")
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user?.role}' is not authorized for this action`);
    }
    next();
  };
};

module.exports = { authorize };
