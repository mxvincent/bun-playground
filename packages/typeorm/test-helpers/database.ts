import { afterAll, afterEach, beforeAll, beforeEach } from "bun:test";
import {
	initializeDataSource,
	TypeormDatabaseContext,
	teardownDataSource,
} from "../src";
import { testDatasource } from "./data-source";

export const useDatabaseContext = (options?: {
	isolationLevel?: "group" | "test";
}): TypeormDatabaseContext => {
	const database = new TypeormDatabaseContext(testDatasource);

	beforeAll(async () => {
		await initializeDataSource(testDatasource, {
			createDatabase: true,
			createSchema: true,
			runMigrations: true,
		});
		await initializeDataSource(testDatasource);
		await testDatasource.synchronize();
	});

	useDatabaseTransaction(database, options?.isolationLevel ?? "group");

	afterAll(async () => {
		await teardownDataSource(testDatasource, 500);
	});

	return database;
};

export const useDatabaseTransaction = (
	database: TypeormDatabaseContext,
	isolation: "group" | "test" = "test",
) => {
	if (isolation === "group") {
		beforeAll(() => database.startTransaction());
		afterAll(() => database.rollbackTransaction());
	}

	if (isolation === "test") {
		beforeEach(() => database.startTransaction());
		afterEach(() => database.rollbackTransaction());
	}
};
