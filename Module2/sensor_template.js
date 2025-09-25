// This is the file with shared helpers for all sensor publishers
import mqtt from "mqtt";

export const BROKER = process.env.BROKER_URL || "mqtt://broker.hivemq.com:1883";
export const ZONE = process.env.ZONE || "zoneA";
export const COUNT = Number(process.env.COUNT || 2);
export const PERIOD = Number(process.env.PERIOD_MS || 1200);

export function jitter(mu, sigma) {
  // approx Gaussian via CLT
  let s = 0;
  for (let i = 0; i < 6; i++) s += Math.random();
  s -= 3; // ~N(0,1)
  return mu + s * sigma;
}
export function nowISO() {
  return new Date().toISOString();
}

export function publishSensor(client, type, id, value, unit) {
  const topic = `forest/${ZONE}/${type}/${id}`;
  const payload = JSON.stringify({
    zone: ZONE,
    type,
    id: String(id),
    value,
    unit,
    ts: nowISO(),
  });
  client.publish(topic, payload, { qos: 0 });
}

export function connectAnd(run) {
  const client = mqtt.connect(BROKER);
  client.on("connect", () => {
    console.log(`mqtt connected -> ${BROKER}`);
    run(client);
  });
  client.on("reconnect", () => console.log("mqtt reconnecting..."));
  client.on("error", (e) => console.error("mqtt error:", e.message));
  client.on("close", () => console.log("mqtt connection closed"));
}
