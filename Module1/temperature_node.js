const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const SENSORS = Number(process.env.SENSORS || 2);
const AREA = process.env.AREA || "Central";

function gaussian(mu, sigma) {
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  s -= 3;
  return mu + s * sigma;
}

function seasonalBase() {
  const d = new Date();
  const m = d.getMonth(); // 0..11
  const h = d.getHours();
  let base = 24;
  if ([11,0,1].includes(m)) base += 3; // Dec-Feb warmer
  if ([5,6,7].includes(m)) base -= 2; // Jun-Aug cooler
  if (h >= 12 && h <= 16) base += 1.5;
  if (h <= 6 || h >= 22) base -= 1.0;
  return base;
}

function startSensor(sensorId) {
  const client = net.createConnection(port, host, () => {
    console.log(`Temp sensor ${sensorId} -> ${AREA}: connected`);
    const tick = () => {
      const value = Math.max(5, gaussian(seasonalBase(), 2.2));
      client.write(`temp,${value.toFixed(1)},${AREA},${sensorId}`);
    };
    tick();
    setInterval(tick, 1500 + Math.random() * 600);
  });

  client.on("data", () => {});
  client.on("error", (e) => console.log(`Temp ${sensorId} err: ${e.message}`));
  client.on("close", () => console.log(`Temp ${sensorId} closed`));
}

for (let i = 0; i < SENSORS; i++) startSensor(i);
