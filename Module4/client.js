import fetch from "node-fetch";

// create new reading
async function createReading() {
  const res = await fetch("http://localhost:4000/api/v1/readings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sensorId: "sensorA",
      location: "Melbourne",
      temperature: Math.floor(Math.random() * 35),
      humidity: Math.floor(Math.random() * 100)
    })
  });
  console.log("Create:", await res.json());
}

// get latest reading
async function getLatest() {
  const res = await fetch("http://localhost:4000/api/v1/readings/latest/sensorA");
  console.log("Latest:", await res.json());
}

// get external weather lookup
async function getWeather() {
  const res = await fetch("http://localhost:4000/api/v1/weather/Melbourne");
  console.log("External Weather:", await res.json());
}

await createReading();
await getLatest();
await getWeather();

const BASE = "http://127.0.0.1:4000";
