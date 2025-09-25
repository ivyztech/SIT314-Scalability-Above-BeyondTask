import mqtt from "mqtt";

const BROKER = process.env.BROKER_URL || "mqtt://broker.hivemq.com:1883";
const client = mqtt.connect(BROKER);

client.on("connect", () => {
  client.subscribe("alerts/social/#");
  console.log(`social relay listening at ${BROKER} -> alerts/social/#`);
});

client.on("message", (topic, payload) => {
  const ts = new Date().toLocaleTimeString();
  console.log(`[SOCIAL ${ts}] ${payload.toString()} (topic: ${topic})`);
});

client.on("error", (e) => console.error("mqtt error:", e.message));
