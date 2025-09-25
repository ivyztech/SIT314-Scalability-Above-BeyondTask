import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EDGE_PORT = process.env.EDGE_PORT || 4000;
const EDGE_URL = `http://127.0.0.1:${EDGE_PORT}`;
const ROOM_ID = process.env.ROOM_ID || "roomA";
const PERIOD_MS = Number(process.env.PERIOD_MS || 2000);

function gaussian(mu, sigma) {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  s -= 3;
  return mu + s * sigma;
}

function genReading() {
  const h = new Date().getHours();

  // temp for daily profile
  let baseT = 22;
  if (h >= 12 && h <= 16) baseT += 5;
  if (h <= 6 || h >= 22) baseT -= 2;
  const temp = Math.max(15, gaussian(baseT, 2.0));

  // humidity inverse-ish
  const humidity = Math.min(95, Math.max(25, 60 - (temp - 22) * 2 + gaussian(0, 5)));

  // occupancy bursts around :05 and :35
  const m = new Date().getMinutes();
  const burst = (m % 30) < 10 ? Math.floor(Math.random() * 8) : Math.floor(Math.random() * 3);
  const occupied = Math.min(30, Math.floor(Math.random() * 8) + burst);

  return { temp: Number(temp.toFixed(1)), humidity: Number(humidity.toFixed(1)), occupied };
}

async function tick() {
  const r = genReading();
  try {
    const { data } = await axios.post(`${EDGE_URL}/sensor`, { roomId: ROOM_ID, ...r });
    console.log(`[${ROOM_ID}] sent ${JSON.stringify(r)} -> decision=${data.decision.mode}${data.decision.target ? `@${data.decision.target}` : ""} changed=${data.changed}`);
  } catch (e) {
    console.error("sensor post error:", e.message);
  }
}

console.log(`Sensor for ${ROOM_ID} posting to ${EDGE_URL} every ${PERIOD_MS}ms`);
setInterval(tick, PERIOD_MS);
tick();
