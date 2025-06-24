-- Add attachments column to chat_messages if it doesn't exist
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- Check if attachments column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'attachments'
    ) THEN
        -- Add the attachments column
        ALTER TABLE chat_messages ADD COLUMN attachments JSONB DEFAULT '[]';
        RAISE NOTICE 'Added attachments column to chat_messages table';
    ELSE
        RAISE NOTICE 'Attachments column already exists in chat_messages table';
    END IF;
END $$; 