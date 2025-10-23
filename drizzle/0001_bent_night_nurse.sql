CREATE TABLE `summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transcriptionId` int NOT NULL,
	`summaryText` text NOT NULL,
	`summaryType` varchar(20) NOT NULL,
	`summaryLanguage` varchar(10) NOT NULL DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transcriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`text` text NOT NULL,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transcriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transcriptionId` int NOT NULL,
	`sourceText` text NOT NULL,
	`translatedText` text NOT NULL,
	`targetLanguage` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
