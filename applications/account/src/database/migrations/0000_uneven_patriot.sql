CREATE TABLE "account"."organization_member" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account"."organization" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"name" text NOT NULL,
	CONSTRAINT "organization_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "account"."user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"email" text NOT NULL,
	"username" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "account"."organization_member" ADD CONSTRAINT "organization_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "account"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account"."organization_member" ADD CONSTRAINT "organization_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "account"."user"("id") ON DELETE no action ON UPDATE no action;