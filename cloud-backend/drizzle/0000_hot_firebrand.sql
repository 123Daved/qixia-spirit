CREATE TABLE `letters` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`spot` text NOT NULL,
	`name` text NOT NULL,
	`note` text NOT NULL,
	`photo` text,
	`visibility` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `letters_owner` ON `letters` (`owner_hash`);--> statement-breakpoint
CREATE INDEX `letters_public` ON `letters` (`status`,`spot`);--> statement-breakpoint
CREATE TABLE `poster_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`spot` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL,
	`reference` text,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `poster_expiry` ON `poster_jobs` (`created`);--> statement-breakpoint
CREATE TABLE `quotas` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
