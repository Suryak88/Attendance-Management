import jwt from "jsonwebtoken";

export function refreshAccessToken(req, res) {
  const token = req.cookies.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { regnum: decoded.regnum },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(403).json({ message: "Refresh token expired" });
  }
}

export function logoutUser(req, res) {
  res.clearCookie("refreshToken", { path: "/", domain: "localhost" });
  res.json({ message: "Logged out" });
}
