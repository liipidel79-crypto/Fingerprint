/**
 * Admin Authentication Middleware
 */

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token || !token.startsWith("admin-token-")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};
