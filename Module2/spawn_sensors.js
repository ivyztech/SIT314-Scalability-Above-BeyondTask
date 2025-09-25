// Spawns all four sensor publishers for a given zone and count
import { spawn } from "node:child_process";

const zone = process.env.ZONE || "zoneA";
const count = String(process.env.COUNT || "3");
const period = String(process.env.PERIOD_MS || "");

const env = { ...process.env, ZONE: zone, COUNT: count };
if (period) env.PERIOD_MS = period;

const files = ["sensor_heat.js", "sensor_smoke.js", "sensor_flame.js", "sensor_humidity.js"];

for (const f of files) {
  const child = spawn(process.execPath, [f], { stdio: "inherit", env });
  child.on("exit", (code) => console.log(`${f} exited with code ${code}`));
}
console.log(`spawned sensors -> zone=${zone}, count=${count}${period ? `, period=${period}ms` : ""}`);
