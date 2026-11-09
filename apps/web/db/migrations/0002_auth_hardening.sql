CREATE TABLE "sign_in_throttle" (
	"email" text PRIMARY KEY NOT NULL,
	"failures" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "setup_completed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "sign_in_throttle_window_idx" ON "sign_in_throttle" USING btree ("window_started_at");--> statement-breakpoint
-- Bestandsdaten: Gibt es schon ein Admin-Konto, gilt die Ersteinrichtung als abgeschlossen.
INSERT INTO "app_settings" ("id", "setup_completed_at")
SELECT 'default', now()
WHERE EXISTS (SELECT 1 FROM "user" WHERE "role" = 'admin')
ON CONFLICT ("id") DO UPDATE
SET "setup_completed_at" = COALESCE("app_settings"."setup_completed_at", EXCLUDED."setup_completed_at");