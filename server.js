const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ===== File Upload Setup =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ===== MongoDB Connection =====
mongoose.connect("YOUR_MONGODB_CONNECTION_STRING")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// ===== Schema =====
const registrationSchema = new mongoose.Schema({
  regID: String,
  collegeName: String,
  mobile: String,
  mailID: String,
  title: String,
  abstract: String,
  transactionID: String,
  participants: Array,
  screenshot: String,
  abstractFile: String,
  date: { type: Date, default: Date.now }
});

const Registration = mongoose.model("Registration", registrationSchema);

// ===== Route =====
app.post("/register",
  upload.fields([
    { name: "screenshot", maxCount: 1 },
    { name: "abstractFile", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const data = req.body;

      const newRegistration = new Registration({
        regID: data.regID,
        collegeName: data.collegeName,
        mobile: data.mobile,
        mailID: data.mailID,
        title: data.title,
        abstract: data.abstract,
        transactionID: data.transactionID,
        participants: JSON.parse(data.participants),
        screenshot: req.files["screenshot"][0].filename,
        abstractFile: req.files["abstractFile"][0].filename
      });

      await newRegistration.save();

      res.json({ message: "✅ Registration Stored Successfully!" });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "❌ Server Error" });
    }
  }
);

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});