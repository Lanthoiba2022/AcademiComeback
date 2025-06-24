-- Comprehensive Chat System Fix
-- Run this in your Supabase SQL Editor

-- 1. Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_typing_indicators CASCADE;
DROP TABLE IF EXISTS chat_presence CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- 2. Create chat_messages table with proper UUID handling
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'audio', 'video', 'system')),
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE
);

-- 3. Create chat_reactions table
CREATE TABLE chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- 4. Create chat_typing_indicators table
CREATE TABLE chat_typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_typing BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 5. Create chat_presence table
CREATE TABLE chat_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
    custom_status TEXT,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 6. Create indexes for performance
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to);
CREATE INDEX idx_chat_reactions_message_id ON chat_reactions(message_id);
CREATE INDEX idx_chat_reactions_user_id ON chat_reactions(user_id);
CREATE INDEX idx_chat_typing_room_id ON chat_typing_indicators(room_id);
CREATE INDEX idx_chat_typing_user_id ON chat_typing_indicators(user_id);
CREATE INDEX idx_chat_presence_room_id ON chat_presence(room_id);
CREATE INDEX idx_chat_presence_user_id ON chat_presence(user_id);

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers for updated_at
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_typing_indicators_updated_at 
    BEFORE UPDATE ON chat_typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_presence_updated_at 
    BEFORE UPDATE ON chat_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Enable Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_presence ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in rooms they have access to" ON chat_messages
    FOR SELECT USING (true); -- For now, allow all reads

CREATE POLICY "Users can insert their own messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- 11. Create RLS policies for chat_reactions
CREATE POLICY "Users can view all reactions" ON chat_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reactions" ON chat_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON chat_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- 12. Create RLS policies for chat_typing_indicators
CREATE POLICY "Users can view typing indicators" ON chat_typing_indicators
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own typing indicators" ON chat_typing_indicators
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own typing indicators" ON chat_typing_indicators
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicators" ON chat_typing_indicators
    FOR DELETE USING (auth.uid() = user_id);

-- 13. Create RLS policies for chat_presence
CREATE POLICY "Users can view presence" ON chat_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own presence" ON chat_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence" ON chat_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presence" ON chat_presence
    FOR DELETE USING (auth.uid() = user_id);

-- 14. Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_presence;

-- 15. Create function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_typing_indicators 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- 16. Create function to clean up old presence records
CREATE OR REPLACE FUNCTION cleanup_presence()
RETURNS void AS $$
BEGIN
    UPDATE chat_presence 
    SET status = 'offline', updated_at = NOW()
    WHERE updated_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- 17. Insert some test data (optional)
-- INSERT INTO chat_messages (room_id, user_id, content) VALUES 
-- ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Hello, this is a test message!');

-- 18. Verify the tables were created correctly
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('chat_messages', 'chat_reactions', 'chat_typing_indicators', 'chat_presence')
ORDER BY table_name, ordinal_position; 