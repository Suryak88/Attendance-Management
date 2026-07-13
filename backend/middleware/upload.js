import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uploadPath = path.join(
      "uploads",
      "medicalCertificate",
      String(year),
      month,
    );

    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename(req, file, cb) {
    const regnum = req.user.regnum;
    const ext = path.extname(file.originalname);
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    const timestamp = `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;

    cb(null, `MC_${regnum}_${timestamp}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid File Type"));
  }
};

export default multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
