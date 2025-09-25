const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const SENSORS = Number(process.env.SENSORS || 2);
const AREA = process.env.AREA || "Central";

function startSensor(sensorId) {
  const client = net.createConnection(port, host, () => {
    console.log(`Wind sensor ${sensorId} -> ${AREA}: connected`);
    const tick = () => {
      const value = Math.max(0, 18 + (Math.random() - 0.5) * 16 + Math.random() * 25); // km/h
      client.write(`wind,${value.toFixed(1)},${AREA},${sensorId}`);
    };
    tick();
    setInterval(tick, 1100 + Math.random() * 600);
  });

  client.on("data", () => {});
  client.on("error", (e) => console.log(`Wind ${sensorId} err: ${e.message}`));
  client.on("close", () => console.log(`Wind ${sensorId} closed`));
}

for (let i = 0; i < SENSORS; i++) startSensor(i);
