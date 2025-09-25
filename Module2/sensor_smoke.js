import { jitter, publishSensor, connectAnd, ZONE, COUNT, PERIOD } from "./sensor_template.js";

connectAnd((client) => {
  for (let i = 0; i < COUNT; i++) {
    const id = i;
    const tick = () => {
      if (process.env.FORCE_BURST) {
        const value = Math.min(100, 80 + Math.random() * 20);
        publishSensor(client, "smoke", id, Number(value.toFixed(1)), "idx");
        return;
      }
      const burst = Math.random() < 0.12 ? 60 + Math.random() * 35 : 0;
      const base = Math.max(0, jitter(8, 12));
      const value = Math.min(100, base + burst); // 0..100
      publishSensor(client, "smoke", id, Number(value.toFixed(1)), "idx");
    };
    tick();
    setInterval(tick, PERIOD + Math.random() * 500);
  }
  console.log(`smoke x${COUNT} -> ${ZONE}`);
});
