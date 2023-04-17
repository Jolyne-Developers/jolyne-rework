import "dotenv/config";
import { createClient, SchemaFieldTypes } from "redis";
import { Pool } from "pg";

const redisClient = createClient({
    url: `redis://localhost:${process.env.DEV_MODE === "true" ? 6380 : 6379}`,
    database: 0,
});
const postgresClient = new Pool({
    user: process.env.PSQL_USER,
    host: "127.0.0.1",
    database: process.env.PSQL_DB,
    password: process.env.PSQL_PASSWORD,
    port: 5432,
});

if (process.argv.includes("--update-psql")) {
    console.log("Updating PostgreSQL database...");
    // add column only if it exists "daily" jsonb
    postgresClient.query(`ALTER TABLE "RPGUsers" ADD COLUMN IF NOT EXISTS "daily" jsonb NOT NULL`);
    console.log("done");
    process.exit(1);
}

const start = async () => {
    if (process.argv.includes("--reset")) {
        // confirm
        const answer = await new Promise((resolve) => {
            console.log("Are you sure you want to reset the database (table)? (y/n) ");
            process.stdin.on("data", (data) => {
                resolve(data.toString().trim());
            });
        });
        if (answer !== "y") {
            console.log("Aborting...");
            process.exit(0);
        }
        console.log("Resetting database...");
        await postgresClient.query('DROP TABLE IF EXISTS "RPGUsers"');

        const keys = await redisClient.keys(`${process.env.REDIS_PREFIX}:*`);
        for await (const key of keys) {
            await redisClient.del(key);
        }
        console.log("done");
    }

    console.log("Creating table RPGUsers");
    await postgresClient.query(`CREATE TABLE IF NOT EXISTS "RPGUsers" (
		"id" varchar(255) NOT NULL PRIMARY KEY UNIQUE,
		"tag" varchar(255) NOT NULL,
		"level" int NOT NULL DEFAULT 1,
		"health" int NOT NULL DEFAULT 100,
		"coins" int NOT NULL DEFAULT 500,
		"stamina" int NOT NULL DEFAULT 60,
		"xp" int NOT NULL DEFAULT 0,
		"stand" varchar(255),
		"language" varchar(255) NOT NULL DEFAULT 'en-US',
		"chapter" jsonb NOT NULL DEFAULT '{"id": 1, "quests": []}',
		"skillPoints" jsonb NOT NULL DEFAULT '{"strength": 0, "defense": 0, "speed": 0, "stamina": 0, "perception": 0}',
		"sideQuests" jsonb[] NOT NULL,
        "daily" jsonb,
        "voteHistory" jsonb NOT NULL DEFAULT '{"total": 0}',
        "standsEvolved" jsonb NOT NULL DEFAULT '{}',
        "emails" jsonb[] NOT NULL,
 		"inventory" jsonb NOT NULL DEFAULT '{"pizza": 5, "mysterious_arrow": 1}',
		"adventureStartedAt" bigint NOT NULL DEFAULT 0
	)
		`);
    // creating indexes for faster queries (find user by id)
    // creating indexes for faster leaderboard queries (find users by level)
    await postgresClient.query(
        `CREATE INDEX IF NOT EXISTS "RPGUsers_level" ON "RPGUsers" ("level")`
    );
    console.log(
        "Table RPGUsers created or already created. IF you didn't use --reset, run: npm run init-db-update"
    );
};

redisClient.on("connect", async () => {
    console.log("Redis connected, creating/updating index for RPGUsers");
    try {
        console.log("Index deleted, recreating it");
    } catch (_) {
        console.log("Index doesn't exist, creating it");
    }

    postgresClient.connect();
    start();
});

redisClient.connect();
