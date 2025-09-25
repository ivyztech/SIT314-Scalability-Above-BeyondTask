import mqtt from "mqtt";

const BROKER = process.env.BROKER_URL || "mqtt://broker.hivemq.com:1883";
const client = mqtt.connect(BROKER);

client.on("connect", () => {
  client.subscribe("alerts/fire/#");
  console.log(`fire service listening at ${BROKER} -> alerts/fire/#`);
});

client.on("message", (topic, payload) => {
  const ts = new Date().toLocaleTimeString();
  let obj;
  try { obj = JSON.parse(payload.toString()); }
  catch { obj = { raw: payload.toString() }; }

  console.log(`[FIRE ${ts}] ${topic}`);
  console.log(JSON.stringify(obj, null, 2));
});

client.on("error", (e) => console.error("mqtt error:", e.message));
