import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import weather from "weather-js";
import Reading from "./models/reading.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB error:", err));

// POST: Create new reading
app.post("/api/v1/readings", async (req, res) => {
  try {
    const { sensorId, location, temperature, humidity } = req.body;
    if (!sensorId || !location || temperature == null || humidity == null) {
      return res.status(400).json({ ok: false, error: "Invalid data" });
    }
    const newReading = new Reading({ sensorId, location, temperature, humidity });
    await newReading.save();
    res.json({ ok: true, data: newReading });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET: All readings
app.get("/api/v1/readings", async (_req, res) => {
  const readings = await Reading.find().sort({ timestamp: -1 });
  res.json({ ok: true, data: readings });
});

// GET: Latest reading per sensor
app.get("/api/v1/readings/latest/:sensorId", async (req, res) => {
  const latest = await Reading.findOne({ sensorId: req.params.sensorId }).sort({ timestamp: -1 });
  res.json({ ok: true, data: latest });
});

// PUT: Update by ID
app.put("/api/v1/readings/:id", async (req, res) => {
  try {
    const updated = await Reading.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ ok: true, data: updated });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE: Remove by ID
app.delete("/api/v1/readings/:id", async (req, res) => {
  try {
    await Reading.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET: External weather-js lookup
app.get("/api/v1/weather/:city", (req, res) => {
  weather.find({ search: req.params.city, degreeType: "C" }, (err, result) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, data: result[0] });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Weather API listening on port ${PORT}`));
