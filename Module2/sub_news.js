import mqtt from "mqtt";

const BROKER = process.env.BROKER_URL || "mqtt://broker.hivemq.com:1883";
const client = mqtt.connect(BROKER);

client.on("connect", () => {
  client.subscribe("alerts/news/#");
  console.log(`news desk listening at ${BROKER} -> alerts/news/#`);
});

client.on("message", (topic, payload) => {
  const ts = new Date().toLocaleTimeString();
  console.log(`[NEWS ${ts}] ${payload.toString()} (topic: ${topic})`);
});

client.on("error", (e) => console.error("mqtt error:", e.message));
