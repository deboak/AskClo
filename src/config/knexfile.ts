import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const environment = process.env.NODE_ENV || "development";

if (!process.env.DB_URL) {
  throw new Error("DB_URL is required to run database migrations");
}

const baseConfig = {
  client: "pg",
  connection: process.env.DB_URL,
  migrations: {
    directory: path.resolve(__dirname, "../db/migrations"),
    extension: "ts",
  },
};

const config = {
  development: {
    ...baseConfig,
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
    },
    debug: true, // logs every SQL query to the console — useful locally, noisy in prod
  },

  production: {
    ...baseConfig,
    pool: {
      min: 2,
      max: 20,
      acquireTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
    },
    debug: false,
  },
};

export default config[environment as keyof typeof config];