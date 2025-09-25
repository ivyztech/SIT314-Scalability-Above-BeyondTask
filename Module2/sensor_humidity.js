import { jitter, publishSensor, connectAnd, ZONE, COUNT, PERIOD } from "./sensor_template.js";

connectAnd((client) => {
  for (let i = 0; i < COUNT; i++) {
    const id = i;
    const tick = () => {
      if (process.env.FORCE_HUMIDITY) {
        const v = Math.max(5, Math.min(100, Number(process.env.FORCE_HUMIDITY)));
        publishSensor(client, "humidity", id, Number(v.toFixed(1)), "%");
        return;
      }
      const h = new Date().getHours();
      let base = (12 <= h && h <= 16) ? 35 : 55; // drier at afternoon peak
      const value = Math.min(100, Math.max(5, jitter(base, 8)));
      publishSensor(client, "humidity", id, Number(value.toFixed(1)), "%");
    };
    tick();
    setInterval(tick, PERIOD + Math.random() * 400);
  }
  console.log(`humidity x${COUNT} -> ${ZONE}`);
});
