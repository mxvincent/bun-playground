import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { timestampColumnOptions } from '../src/schema'

export const authors = pgTable('author', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at', timestampColumnOptions).notNull(),
	gender: text('gender').notNull().default('unknown'),
	age: integer('age')
})

export const posts = pgTable('post', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: text('name'),
	authorId: uuid('author_id')
		.notNull()
		.references(() => authors.id)
})

export const dateContainers = pgTable('date_container', {
	id: uuid('id').primaryKey().defaultRandom(),
	a: timestamp('a', timestampColumnOptions),
	b: timestamp('b', timestampColumnOptions)
})
