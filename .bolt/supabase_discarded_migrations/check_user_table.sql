-- Check User Table Structure
-- This will help identify the correct user table name and structure

-- 1. Check what tables exist that might contain user information
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%user%' 
OR table_name LIKE '%profile%'
OR table_name LIKE '%auth%'
ORDER BY table_name;

-- 2. Check the auth.users table (Supabase default)
SELECT 
    'auth.users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check if there's a public profiles table
SELECT 
    'public.profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check if there's a public users table
SELECT 
    'public.users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Sample some user data (if any table exists)
-- Uncomment the appropriate section based on what tables exist above

-- For auth.users:
-- SELECT id, email, created_at FROM auth.users LIMIT 5;

-- For public.profiles:
-- SELECT id, full_name, email FROM public.profiles LIMIT 5;

-- For public.users:
-- SELECT id, name, email FROM public.users LIMIT 5; 