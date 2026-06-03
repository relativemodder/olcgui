ALTER TABLE `instances` ADD `user_id` integer REFERENCES `users`(`id`) ON UPDATE no action ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX `instances_user_id_index` ON `instances` (`user_id`);
