import { publishSensor, connectAnd, ZONE, COUNT, PERIOD } from "./sensor_template.js";

connectAnd((client) => {
  for (let i = 0; i < COUNT; i++) {
    const id = i;
    const tick = () => {
      const forced = process.env.FORCE_FLAME ? Number(process.env.FORCE_FLAME) : null;
      const spike = forced ?? (Math.random() < 0.08 ? (0.6 + Math.random() * 0.4) : Math.random() * 0.1);
      publishSensor(client, "flame", id, Number(spike.toFixed(2)), "");
    };
    tick();
    setInterval(tick, PERIOD + Math.random() * 300);
  }
  console.log(`flame x${COUNT} -> ${ZONE}`);
});
