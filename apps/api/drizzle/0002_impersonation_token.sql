ALTER TYPE "public"."auth_token_purpose" ADD VALUE 'impersonate';--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD COLUMN "staff_user_id" uuid;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_staff_user_id_staff_users_id_fk" FOREIGN KEY ("staff_user_id") REFERENCES "public"."staff_users"("id") ON DELETE cascade ON UPDATE no action;