-- Test Message Insert
-- This will help verify if the chat system is working

-- 1. Insert a test message
INSERT INTO chat_messages (
    id,
    room_id,
    user_id,
    content,
    message_type,
    created_at
) VALUES (
    gen_random_uuid(),
    '0da7f042-1fe8-4620-80e1-ce34db217214',
    'f8459933-490c-493b-9030-2e6a94879773',
    'Test message from SQL - ' || NOW(),
    'text',
    NOW()
) RETURNING id, content, created_at;

-- 2. Verify the message was inserted
SELECT 
    id,
    room_id,
    user_id,
    content,
    message_type,
    created_at
FROM chat_messages 
WHERE room_id = '0da7f042-1fe8-4620-80e1-ce34db217214'
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if real-time should have picked it up
-- (This message should appear in your app if real-time is working) 