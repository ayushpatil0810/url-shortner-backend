import { DATABASE_URL } from "./env.js";
import { drizzle } from "drizzle-orm/neon-http";

const db = drizzle(DATABASE_URL);

export default db;
