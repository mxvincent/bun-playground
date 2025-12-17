import { EnvValue } from "@package/core";
import { logger } from "@package/telemetry";
import { PinoLoggerAdapter, PostgresDatabaseSource } from "../src";
import { Author, DateContainer, Post } from "./entities";

export const testDatasource = new PostgresDatabaseSource({
	type: "postgres",
	schema: EnvValue.string("POSTGRES_SCHEMA") ?? "typeorm",
	host: EnvValue.string("POSTGRES_HOST") ?? "127.0.0.1",
	port: EnvValue.number("POSTGRES_PORT") ?? 5432,
	database: EnvValue.string("POSTGRES_DATABASE") ?? "tests",
	username: EnvValue.string("POSTGRES_USERNAME") ?? "mxvincent",
	password: EnvValue.string("POSTGRES_PASSWORD") ?? "mxvincent",
	entities: [Author, Post, DateContainer],
	logger: new PinoLoggerAdapter(logger),
});
