/**
 * PostgreSQL Error Codes
 *
 * Documentation: https://www.postgresql.org/docs/12/errcodes-appendix.html
 */

export enum PostgresErrorCode {
	/**
	 * Class 23 — Integrity Constraint Violation
	 */
	IntegrityConstraintViolation = '23000',
	RestrictViolation = '23001',
	NotNullViolation = '23502',
	ForeignKeyViolation = '23503',
	UniqueViolation = '23505',
	CheckViolation = '23514',
	ExclusionViolation = '23P01'
}
