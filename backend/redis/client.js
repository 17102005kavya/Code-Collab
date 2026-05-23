const Redis = require("ioredis");

// Provide fallback localhost connection if REDIS_URL is not set
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

pub.on("error", (err) => console.error("Redis Pub Error:", err));
sub.on("error", (err) => console.error("Redis Sub Error:", err));

module.exports = { pub, sub };
