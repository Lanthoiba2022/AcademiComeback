-- Test User Lookup
-- This will verify that user information can be retrieved from the profiles table

-- 1. Check if the specific users exist in profiles
SELECT 
    id,
    full_name,
    email,
    created_at
FROM profiles 
WHERE id IN (
    'f8459933-490c-493b-9030-2e6a94879773',
    'b56b7d35-e952-4b51-bc18-94d410aef822'
);

-- 2. Check all users who have sent messages
SELECT DISTINCT
    p.id,
    p.full_name,
    p.email,
    COUNT(m.id) as message_count
FROM profiles p
JOIN chat_messages m ON p.id = m.user_id
WHERE m.room_id = '0da7f042-1fe8-4620-80e1-ce34db217214'
GROUP BY p.id, p.full_name, p.email
ORDER BY message_count DESC;

-- 3. Test the exact query that the app will use
SELECT 
    id,
    full_name,
    email
FROM profiles 
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM chat_messages 
    WHERE room_id = '0da7f042-1fe8-4620-80e1-ce34db217214'
); 