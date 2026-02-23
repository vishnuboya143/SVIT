const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// ====== PostgreSQL Connection (Render) ======
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://ece_department:3XUfPfvm2jSXbY4KyLUA4hOcDDs85Ke3@dpg-d6e57vnpm1nc73a7rgvg-a.singapore-postgres.render.com/ecesvit_r1ix",
  ssl: { rejectUnauthorized: false } // Render requires SSL
});

// ====== Multer Storage for File Uploads ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ====== Create Table if Not Exists ======
const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      regID VARCHAR(20),
      collegeName TEXT,
      mobile TEXT,
      mailID TEXT,
      title TEXT,
      abstractText TEXT,
      abstractFile TEXT,
      transactionID TEXT,
      paymentScreenshot TEXT,
      participants JSONB,
      totalAmount INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDB();

// ====== API Endpoint ======
app.post(
  "/register",
  upload.fields([{ name: "screenshot" }, { name: "abstractFile" }]),
  async (req, res) => {
    try {
      const data = req.body;
      const participants = JSON.parse(data.participants);

      const abstractFilePath = req.files["abstractFile"]
        ? req.files["abstractFile"][0].path
        : null;
      const screenshotPath = req.files["screenshot"]
        ? req.files["screenshot"][0].path
        : null;

      await pool.query(
        `INSERT INTO registrations 
        (regID, collegeName, mobile, mailID, title, abstractText, abstractFile, transactionID, paymentScreenshot, participants, totalAmount) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          data.regID,
          data.collegeName,
          data.mobile,
          data.mailID,
          data.title,
          data.abstract,
          abstractFilePath,
          data.transactionID,
          screenshotPath,
          JSON.stringify(participants),
          data.totalAmount,
        ]
      );

      res.json({
        message: "✅ Registration saved successfully!",
        regID: data.regID,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "❌ Error saving registration" });
    }
  }
);

// ====== Serve Uploaded Files ======
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====== Start Server ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
