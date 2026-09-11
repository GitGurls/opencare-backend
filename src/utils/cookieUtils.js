// Sets the JWT as an httpOnly cookie - JavaScript on the frontend can never read this,
// which is what protects it from XSS-based token theft (the reason we're not using localStorage).
const setTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true, // not accessible via document.cookie / JS
    secure: isProd, // only sent over HTTPS in production
    sameSite: isProd ? "none" : "lax", // "none" needed if frontend+backend are on different domains in prod (must pair with secure:true)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, keep in sync with JWT_EXPIRES_IN
    path: "/",
  });
};

const clearTokenCookie = (res) => {
  res.clearCookie("token", { path: "/" });
};

module.exports = { setTokenCookie, clearTokenCookie };
