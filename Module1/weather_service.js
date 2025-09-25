const net = require("net");
const port = 6000;

// CFA Areas 
const AREAS = [
  "Mallee", "Wimmera", "SouthWest", "NorthernCountry",
  "NorthCentral", "Central", "WestAndSouthGippsland",
  "EastGippsland"
];

// latest reading by area and type 
const latest = new Map(); // key = `${area}:${type}` -> {value, ts, extra}

// Ingest queue (mini batching to show a scalability tweak) 
const queue = [];

// Batch process every 200 ms to smooth spikes 
setInterval(() => {
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  for (const r of batch) {
    latest.set(`${r.area}:${r.type}`, { value: r.value, ts: Date.now(), extra: r.extra || {} });
  }
}, 200);

// Simple helper 
function parseMsg(buf) {
  // format: name,value,area[,sensorId]
  // examples: temp,28,Central,0  | request,0,Central
  const str = buf.toString().trim();
  const parts = str.split(",");
  const name = parts[0];
  const value = parseFloat(parts[1]);
  const area = parts[2] || "Central";
  const sensorId = parts[3] || "0";
  return { name, value, area, sensorId, raw: str };
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

// Map CFA text level to numeric weight (for combining) 
const FIRE_LEVEL_WEIGHT = {
  "No Warning": 0,
  "Advice": 1,
  "Watch and Act": 2,
  "Emergency Warning": 3
};

function computeWarning(area) {
  const T = latest.get(`${area}:temp`)?.value ?? null;
  const W = latest.get(`${area}:wind`)?.value ?? null;
  const R = latest.get(`${area}:rain`)?.value ?? null;
  const Ftxt = latest.get(`${area}:fire`)?.extra?.level ?? "No Warning";
  const Fw = FIRE_LEVEL_WEIGHT[Ftxt] ?? 0;

  let level = "Everything fine";
  const reasons = [];

  if (T !== null && T > 35) { reasons.push("high temperature"); level = "Advisory"; }
  if (W !== null && W > 45) { reasons.push("strong winds"); level = "Advisory"; }
  if (R !== null && R > 70) { reasons.push("heavy rain"); level = "Watch"; }
  if (T !== null && W !== null && T > 36 && W > 50) { reasons.push("heat + wind"); level = "Warning"; }
  if (Fw >= 2) { reasons.push(`CFA: ${Ftxt}`); level = "Warning"; }
  if (Fw === 3) { reasons.push(`CFA: ${Ftxt}`); level = "Emergency"; }

  return {
    level,
    reasons,
    snapshot: { temperature: T, wind: W, rain: R, fireLevel: Ftxt },
    area,
    at: new Date().toISOString()
  };
}

const server = net.createServer((socket) => {
  console.log("Client connected");

  socket.on("data", (data) => {
    const msg = parseMsg(data);
    // console.log(`RX: ${msg.raw}`);

    let result = "ok";

    switch (msg.name) {
      case "temp":
      case "rain":
      case "wind": {
        const key = `${msg.area}:${msg.name}`;
        queue.push({ type: msg.name, area: msg.area, value: msg.value });
        result = `stored:${key}`;
        break;
      }
      case "fire": {
        // fire message uses "value" as numeric risk 0..1, plus a text level in extra
        // but it allows sending text by packing it into "extra.level"
        const extra = { level: msg.sensorId  || "Advice" };
        if (FIRE_LEVEL_WEIGHT[extra.level] === undefined) extra.level = "Advice";
        queue.push({ type: "fire", area: msg.area, value: msg.value, extra });
        result = `stored:${msg.area}:fire:${extra.level}`;
        break;
      }
      case "request": {
        if (!AREAS.includes(msg.area)) {
          result = `error:unknown-area:${msg.area}`;
          break;
        }
        const w = computeWarning(msg.area);
        result = JSON.stringify(w);
        break;
      }
      default:
        result = "error:unknown-command";
    }

    socket.write(result.toString());
  });

  socket.on("end", () => console.log("Client disconnected"));
  socket.on("error", (e) => console.log(`Socket Error: ${e.message}`));
});

server.on("error", (e) => console.log(`Server Error: ${e.message}`));

server.listen(port, () => {
  console.log(`TCP socket server is running on port: ${port}`);
});
