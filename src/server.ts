import app from "./app.js";
import { AppError } from "./utils/app-error.js";

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received; closing server...`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close server:", error);
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));