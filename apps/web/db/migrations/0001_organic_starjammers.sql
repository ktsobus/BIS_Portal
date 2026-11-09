CREATE TABLE "catalog_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"stats" jsonb NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_sync_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"message" text,
	"stats" jsonb,
	"snapshot_id" uuid
);
--> statement-breakpoint
ALTER TABLE "catalog_sync_run" ADD CONSTRAINT "catalog_sync_run_snapshot_id_catalog_snapshot_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."catalog_snapshot"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_snapshot_created_at_idx" ON "catalog_snapshot" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "catalog_sync_run_started_at_idx" ON "catalog_sync_run" USING btree ("started_at");