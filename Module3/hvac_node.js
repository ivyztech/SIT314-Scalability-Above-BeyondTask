import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.HVAC_PORT || 6000;

// in-memory state: { [roomId]: { mode, target, updatedAt } }
const state = {};

// POST /hvac/set  body: { roomId, mode: 'off|cool|heat|fan', target?: number }
app.post("/hvac/set", (req, res) => {
  const { roomId, mode, target } = req.body || {};
  if (!roomId || !mode) {
    return res.status(400).json({ ok: false, error: "roomId and mode required" });
  }
  const prev = state[roomId] || { mode: "off", target: null };
  state[roomId] = { mode, target: target ?? null, updatedAt: new Date().toISOString() };
  return res.json({ ok: true, roomId, applied: state[roomId], prev });
});

// GET /hvac/state/:roomId
app.get("/hvac/state/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const st = state[roomId] || { mode: "off", target: null, updatedAt: null };
  return res.json({ ok: true, roomId, state: st });
});

// list all rooms
app.get("/hvac/state", (_req, res) => res.json({ ok: true, all: state }));

app.listen(PORT, () => console.log(`HVAC node listening on :${PORT}`));
