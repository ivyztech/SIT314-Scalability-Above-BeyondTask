const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const SENSORS = Number(process.env.SENSORS || 1);
const AREA = process.env.AREA || "Central";

// CFA levels 
const LEVELS = ["No Warning", "Advice", "Watch and Act", "Emergency Warning"];

function pickLevel() {
  // Weighted choice leaning to lower levels, with occasional spikes
  const r = Math.random();
  if (r < 0.70) return "No Warning";
  if (r < 0.88) return "Advice";
  if (r < 0.97) return "Watch and Act";
  return "Emergency Warning";
}

function startSensor(sensorId) {
  const client = net.createConnection(port, host, () => {
    console.log(`Fire service ${sensorId} -> ${AREA}: connected`);
    const tick = () => {
      const level = pickLevel();
      const risk = level === "No Warning" ? 0 :
                   level === "Advice" ? 0.35 :
                   level === "Watch and Act" ? 0.7 : 0.95;
      // sending text level by placing it in the 4th CSV field (server reads it as extra.level)
      client.write(`fire,${risk},${AREA},${level}`);
    };
    tick();
    setInterval(tick, 2500 + Math.random() * 1500);
  });

  client.on("data", () => {});
  client.on("error", (e) => console.log(`Fire ${sensorId} err: ${e.message}`));
  client.on("close", () => console.log(`Fire ${sensorId} closed`));
}

for (let i = 0; i < SENSORS; i++) startSensor(i);
