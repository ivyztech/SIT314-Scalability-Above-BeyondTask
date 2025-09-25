import mongoose from "mongoose";

const ReadingSchema = new mongoose.Schema({
  sensorId: { type: String, required: true },
  location: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true }
});

export default mongoose.model("Reading", ReadingSchema);
