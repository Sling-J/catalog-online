-- pg_trgm входит в contrib PostgreSQL (официальный образ, управляемые базы); нужен для поиска витрины (T-611)
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);
