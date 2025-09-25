import { jitter, publishSensor, connectAnd, ZONE, COUNT, PERIOD } from "./sensor_template.js";

function diurnalBase() {
  const d = new Date();
  const m = d.getMonth(); // 0..11
  const h = d.getHours();
  let base = 24;
  if ([11, 0, 1].includes(m)) base += 3;  // Dec–Feb warmer (AU summer)
  if ([5, 6, 7].includes(m)) base -= 2;   // Jun–Aug cooler (AU winter)
  if (12 <= h && h <= 16) base += 4;      // afternoon peak
  if (h >= 22 || h <= 6) base -= 2;       // night cooling
  return base;
}

connectAnd((client) => {
  for (let i = 0; i < COUNT; i++) {
    const id = i;
    const tick = () => {
      const forced = process.env.FORCE_HEAT ? Number(process.env.FORCE_HEAT) : null;
      const value = forced ?? Math.max(5, jitter(diurnalBase(), 2.5));
      publishSensor(client, "heat", id, Number(value.toFixed(1)), "C");
    };
    tick();
    setInterval(tick, PERIOD + Math.random() * 400);
  }
  console.log(`heat x${COUNT} -> ${ZONE}`);
});
