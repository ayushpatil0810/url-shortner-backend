import { REDIS_URL } from "./env.js";
import Redis from "ioredis";

const redis =  Redis();

export default redis;
