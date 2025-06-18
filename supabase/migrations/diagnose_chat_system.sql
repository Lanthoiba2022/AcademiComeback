-- Comprehensive Chat System Diagnostic
-- Run this to check all aspects of the chat system

-- 1. Check if real-time is properly enabled
SELECT 
    'Real-time Status' as check_type,
    schemaname,
    tablename,
    '✅ ENABLED' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY tablename;

-- 2. Check table structure
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY table_name, ordinal_position;

-- 3. Check RLS policies
SELECT 
    'RLS Policies' as check_type,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY tablename, policyname;

-- 4. Check if there are any existing messages
SELECT 
    'Message Count' as check_type,
    COUNT(*) as total_messages,
    COUNT(DISTINCT room_id) as unique_rooms,
    COUNT(DISTINCT user_id) as unique_users
FROM chat_messages;

-- 5. Check recent messages (if any exist)
SELECT 
    'Recent Messages' as check_type,
    id,
    room_id,
    user_id,
    LEFT(content, 50) as message_preview,
    created_at,
    message_type
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Check presence records
SELECT 
    'Presence Records' as check_type,
    COUNT(*) as total_presence_records,
    COUNT(CASE WHEN status = 'online' THEN 1 END) as online_users
FROM chat_presence;

-- 7. Check typing indicators
SELECT 
    'Typing Indicators' as check_type,
    COUNT(*) as total_typing_records,
    COUNT(CASE WHEN is_typing = true THEN 1 END) as currently_typing
FROM chat_typing_indicators;

-- 8. Check reactions
SELECT 
    'Reactions' as check_type,
    COUNT(*) as total_reactions
FROM chat_reactions;

-- 9. Test UUID generation
SELECT 
    'UUID Generation' as check_type,
    gen_random_uuid() as test_uuid;

-- 10. Check if the specific room exists in messages
SELECT 
    'Room Check' as check_type,
    '0da7f042-1fe8-4620-80e1-ce34db217214' as room_id,
    COUNT(*) as messages_in_room
FROM chat_messages 
WHERE room_id = '0da7f042-1fe8-4620-80e1-ce34db217214';

-- 11. Check if the specific user exists in messages
SELECT 
    'User Check' as check_type,
    'f8459933-490c-493b-9030-2e6a94879773' as user_id,
    COUNT(*) as messages_by_user
FROM chat_messages 
WHERE user_id = 'f8459933-490c-493b-9030-2e6a94879773'; 