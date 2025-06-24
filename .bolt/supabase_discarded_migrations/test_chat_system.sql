-- Test Chat System
-- Run this after the main fix script to verify everything works

-- 1. Test UUID generation
SELECT gen_random_uuid() as test_uuid;

-- 2. Test table structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;

-- 3. Test inserting a message (replace with actual UUIDs from your app)
-- Note: You'll need to replace these UUIDs with actual room_id and user_id values
-- INSERT INTO chat_messages (room_id, user_id, content) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Test message from SQL');

-- 4. Check if real-time is enabled
SELECT 
    schemaname,
    tablename,
    attname,
    atttypid::regtype as data_type
FROM pg_publication_tables pt
JOIN pg_attribute a ON a.attrelid = pt.tablename::regclass
WHERE pt.pubname = 'supabase_realtime'
AND pt.tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY pt.tablename, a.attnum;

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY tablename, policyname;

-- 6. Test message retrieval (if you have test data)
-- SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT 5; 