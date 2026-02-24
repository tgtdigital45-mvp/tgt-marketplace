-- Remove NOT NULL constraint from job_id in messages to allow order chats to work
ALTER TABLE messages ALTER COLUMN job_id DROP NOT NULL;
