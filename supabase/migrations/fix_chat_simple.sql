-- Simple fix for chat tables
-- Run this in your Supabase SQL Editor

-- Drop existing tables completely
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create chat_messages table with correct structure
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    reply_to UUID,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_room_id 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create chat_reactions table
CREATE TABLE chat_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- Add foreign key constraints for chat_reactions
ALTER TABLE chat_reactions 
ADD CONSTRAINT fk_chat_reactions_message_id 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_reactions 
ADD CONSTRAINT fk_chat_reactions_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create chat_typing_indicators table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_typing BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Add foreign keys for chat_typing_indicators if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_typing_indicators_room_id' AND table_name = 'chat_typing_indicators') THEN
        ALTER TABLE chat_typing_indicators ADD CONSTRAINT fk_chat_typing_indicators_room_id 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_typing_indicators_user_id' AND table_name = 'chat_typing_indicators') THEN
        ALTER TABLE chat_typing_indicators ADD CONSTRAINT fk_chat_typing_indicators_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_room_id') THEN
        CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_user_id') THEN
        CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_messages_created_at') THEN
        CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_reactions_message_id') THEN
        CREATE INDEX idx_chat_reactions_message_id ON chat_reactions(message_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_typing_indicators_room_id') THEN
        CREATE INDEX idx_chat_typing_indicators_room_id ON chat_typing_indicators(room_id);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in rooms they are members of" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in rooms they are members of" ON chat_messages;
DROP POLICY IF EXISTS "Users can view reactions in rooms they are members of" ON chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages" ON chat_reactions;
DROP POLICY IF EXISTS "Users can view typing indicators in rooms they are members of" ON chat_typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status" ON chat_typing_indicators;

-- Create RLS policies
CREATE POLICY "Users can view messages in rooms they are members of" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = chat_messages.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in rooms they are members of" ON chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = chat_messages.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view reactions in rooms they are members of" ON chat_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages cm
            JOIN room_members rm ON rm.room_id = cm.room_id
            WHERE cm.id = chat_reactions.message_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages" ON chat_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view typing indicators in rooms they are members of" ON chat_typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = chat_typing_indicators.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own typing status" ON chat_typing_indicators
    FOR ALL USING (auth.uid() = user_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
DROP TRIGGER IF EXISTS update_chat_typing_indicators_updated_at ON chat_typing_indicators;

-- Create triggers
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_typing_indicators_updated_at 
    BEFORE UPDATE ON chat_typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Show the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position; 