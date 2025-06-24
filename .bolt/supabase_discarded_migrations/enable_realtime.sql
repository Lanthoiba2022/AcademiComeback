-- Enable Real-time for Chat Tables
-- Run this in your Supabase SQL Editor

-- 1. Check current real-time status
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence') 
        THEN '✅ INCLUDED' 
        ELSE '❌ NOT INCLUDED' 
    END as realtime_status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY tablename;

-- 2. Add chat tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_presence;

-- 3. Verify the tables are now included
SELECT 
    schemaname,
    tablename,
    '✅ INCLUDED' as realtime_status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY tablename;

-- 4. Test inserting a message (optional - uncomment to test)
-- INSERT INTO chat_messages (room_id, user_id, content) VALUES 
-- ('0da7f042-1fe8-4620-80e1-ce34db217214', 'f8459933-490c-493b-9030-2e6a94879773', 'Test message from SQL - real-time should work now!'); 