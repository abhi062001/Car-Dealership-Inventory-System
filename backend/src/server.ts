import { env } from "./config/env.js";
import app from "./app.js";

app.listen(env.port, () => {
  console.log(`Dealership API listening on http://localhost:${env.port}`);
});
