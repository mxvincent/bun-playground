import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { timestampWithTimeZone } from '../src/helpers/entities'

export type Gender = 'female' | 'male' | 'unknown';

@Entity({ name: 'Author' })
export class Author {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'text' })
	name!: string

	@CreateDateColumn(timestampWithTimeZone())
	createdAt!: Date

	@Column({ type: 'text', default: 'unknown' })
	gender!: Gender

	@Column({ type: 'int', nullable: true })
	age!: number

	@OneToMany(
		() => Post,
		(post) => post.author,
		{ cascade: ['insert'] }
	)
	posts?: Post[]
}

@Entity({ name: 'DateContainer' })
export class DateContainer {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column(timestampWithTimeZone({ nullable: true }))
	a!: Date

	@Column(timestampWithTimeZone({ nullable: true }))
	b!: Date | null
}

@Entity({ name: 'Post' })
export class Post {
	@PrimaryGeneratedColumn('increment')
	id!: number

	@Column({ type: 'text', nullable: true })
	name: string | null = null

	@Column('uuid')
	authorId!: string

	@ManyToOne(
		() => Author,
		(user) => user.posts
	)
	author?: Author
}
