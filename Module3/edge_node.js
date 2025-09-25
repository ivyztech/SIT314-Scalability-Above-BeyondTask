import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const EDGE_PORT = process.env.EDGE_PORT || 4000;
const HVAC_BASE_URL = process.env.HVAC_BASE_URL || "http://127.0.0.1:6000";
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "smart_hvac";

if (!MONGODB_URI) {
  console.error(" Missing MONGODB_URI in .env");
  process.exit(1);
}

const mongoClient = new MongoClient(MONGODB_URI);
let db, logsCol, readingsCol;

async function initDb() {
  await mongoClient.connect();
  db = mongoClient.db(MONGODB_DB);
  logsCol = db.collection("hvac_logs");
  readingsCol = db.collection("sensor_readings");
  console.log("Connected to MongoDB Atlas");
}
initDb().catch((e) => {
  console.error("Mongo init error:", e);
  process.exit(1);
});

// Decision Logic (with simple hysteresis) 
function decideMode({ temp, humidity, occupied, prevMode }) {
  // thresholds
  const TOO_HOT = 28;
  const TOO_COLD = 18;
  const DRY_ENOUGH = 70; // if humidity < 70 and temp reasonable, fan is fine
  const PEOPLE_THRESHOLD = 10;

  // so that it doesn't flap rapidly
  const margin = 1.0;

  if (temp > TOO_HOT + margin && occupied > PEOPLE_THRESHOLD) {
    return { mode: "cool", target: 23, reason: "temp high & room occupied" };
  }
  if (temp < TOO_COLD - margin) {
    return { mode: "heat", target: 21, reason: "temp low" };
  }
  if (occupied <= 1) {
    // essentially empty → save energy
    return { mode: "off", target: null, reason: "room empty" };
  }
  if (temp >= 21 && temp <= 26 && humidity < DRY_ENOUGH) {
    return { mode: "fan", target: null, reason: "comfort band with airflow" };
  }
  // fallback to keep previous if no strong reason to change
  return { mode: prevMode || "off", target: null, reason: "hold" };
}

// helper to get current hvac state from hvac node
async function getHvacState(roomId) {
  const { data } = await axios.get(`${HVAC_BASE_URL}/hvac/state/${roomId}`);
  return data?.state || { mode: "off", target: null };
}

// helper to set hvac
async function setHvac(roomId, mode, target) {
  const { data } = await axios.post(`${HVAC_BASE_URL}/hvac/set`, { roomId, mode, target });
  return data;
}

// POST /sensor   body: { roomId, temp, humidity, occupied }
app.post("/sensor", async (req, res) => {
  try {
    const { roomId, temp, humidity, occupied } = req.body || {};
    if (!roomId || temp === undefined || humidity === undefined || occupied === undefined) {
      return res.status(400).json({ ok: false, error: "roomId, temp, humidity, occupied required" });
    }

    // store raw reading
    const reading = { roomId, temp, humidity, occupied, ts: new Date().toISOString() };
    await readingsCol.insertOne(reading);

    // get current hvac mode
    const current = await getHvacState(roomId);
    const decision = decideMode({ temp, humidity, occupied, prevMode: current.mode });

    // only call HVAC if change is needed
    let hvacResponse = null;
    if (decision.mode !== current.mode) {
      hvacResponse = await setHvac(roomId, decision.mode, decision.target);
    }

    const log = {
      roomId,
      reading,
      decision,
      previous: current,
      changed: decision.mode !== current.mode,
      hvacResponse,
      ts: new Date().toISOString()
    };
    await logsCol.insertOne(log);

    return res.json({ ok: true, decision, changed: decision.mode !== current.mode });
  } catch (e) {
    console.error("edge /sensor error:", e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /logs?roomId=R&limit=20
app.get("/logs", async (req, res) => {
  const { roomId, limit = 20 } = req.query;
  const q = roomId ? { roomId } : {};
  const items = await logsCol.find(q).sort({ _id: -1 }).limit(Number(limit)).toArray();
  res.json({ ok: true, count: items.length, items });
});

app.listen(EDGE_PORT, () => console.log(`Edge node listening on :${EDGE_PORT}`));
