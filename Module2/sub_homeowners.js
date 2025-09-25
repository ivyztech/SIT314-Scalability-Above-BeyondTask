import mqtt from "mqtt";

const BROKER = process.env.BROKER_URL || "mqtt://broker.hivemq.com:1883";
const client = mqtt.connect(BROKER);

client.on("connect", () => {
  client.subscribe("alerts/homeowners/#");
  console.log(`homeowners listening at ${BROKER} -> alerts/homeowners/#`);
});

client.on("message", (topic, payload) => {
  const ts = new Date().toLocaleTimeString();
  console.log(`[HOMEOWNERS ${ts}] ${topic}: ${payload.toString()}`);
});

client.on("error", (e) => console.error("mqtt error:", e.message));
