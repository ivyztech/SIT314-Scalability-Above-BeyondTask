const net = require("net");

const host = "127.0.0.1";
const port = 6000;
const USERS = Number(process.env.USERS || 10);
//Comma-separated list of areas to spread requests across 
const AREAS = (process.env.AREAS || "Central,NorthCentral,EastGippsland").split(",");

function requester(id, area) {
  const client = net.createConnection(port, host, () => {
    console.log(`Requester ${id} -> ${area}: connected`);
    const tick = () => {
      const t0 = performance.now?.() || Date.now();
      client.write(`request,0,${area}`);
      // measuring latency on 'data'
      client.once("data", (buf) => {
        const t1 = performance.now?.() || Date.now();
        const ms = (t1 - t0).toFixed(1);
        try {
          const w = JSON.parse(buf.toString());
          console.log(`[u${id}@${area}] ${w.level} | ${ms} ms | reasons: ${w.reasons.join("; ")}`);
        } catch {
          console.log(`[u${id}@${area}] ${buf.toString()} | ${ms} ms`);
        }
      });
    };
    tick();
    setInterval(tick, 1200 + Math.random() * 800);
  });

  client.on("error", (e) => console.log(`Requester ${id} err: ${e.message}`));
  client.on("close", () => console.log(`Requester ${id} closed`));
}

for (let i = 0; i < USERS; i++) {
  requester(i, AREAS[i % AREAS.length]);
}
