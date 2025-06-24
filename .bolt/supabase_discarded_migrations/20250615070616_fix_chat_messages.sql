-- Fix chat_messages table structure
-- This migration ensures all required columns exist

-- Drop existing chat_messages table if it exists and recreate it properly
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_attachments CASCADE;
DROP TABLE IF EXISTS chat_read_receipts CASCADE;
DROP TABLE IF EXISTS chat_pinned_messages CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Create chat_messages table with correct structure
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'reaction')),
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

ALTER TABLE chat_messages 
ADD CONSTRAINT fk_chat_messages_reply_to 
FOREIGN KEY (reply_to) REFERENCES chat_messages(id) ON DELETE SET NULL;

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

-- Create chat_attachments table
CREATE TABLE chat_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100),
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for chat_attachments
ALTER TABLE chat_attachments 
ADD CONSTRAINT fk_chat_attachments_message_id 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

-- Create chat_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, setting_key)
);

-- Add foreign key for chat_settings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_settings_room_id' AND table_name = 'chat_settings') THEN
        ALTER TABLE chat_settings ADD CONSTRAINT fk_chat_settings_room_id 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create chat_presence table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Add constraints for chat_presence if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'chat_presence_status_check' AND table_name = 'chat_presence') THEN
        ALTER TABLE chat_presence ADD CONSTRAINT chat_presence_status_check 
        CHECK (status IN ('available', 'away', 'busy', 'offline'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_presence_room_id' AND table_name = 'chat_presence') THEN
        ALTER TABLE chat_presence ADD CONSTRAINT fk_chat_presence_room_id 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_chat_presence_user_id' AND table_name = 'chat_presence') THEN
        ALTER TABLE chat_presence ADD CONSTRAINT fk_chat_presence_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

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

-- Create chat_read_receipts table
CREATE TABLE chat_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Add foreign key constraints for chat_read_receipts
ALTER TABLE chat_read_receipts 
ADD CONSTRAINT fk_chat_read_receipts_message_id 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_read_receipts 
ADD CONSTRAINT fk_chat_read_receipts_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create chat_pinned_messages table
CREATE TABLE chat_pinned_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    message_id UUID NOT NULL,
    pinned_by UUID NOT NULL,
    pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, message_id)
);

-- Add foreign key constraints for chat_pinned_messages
ALTER TABLE chat_pinned_messages 
ADD CONSTRAINT fk_chat_pinned_messages_room_id 
FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;

ALTER TABLE chat_pinned_messages 
ADD CONSTRAINT fk_chat_pinned_messages_message_id 
FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE;

ALTER TABLE chat_pinned_messages 
ADD CONSTRAINT fk_chat_pinned_messages_pinned_by 
FOREIGN KEY (pinned_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to);

CREATE INDEX idx_chat_reactions_message_id ON chat_reactions(message_id);
CREATE INDEX idx_chat_reactions_user_id ON chat_reactions(user_id);

CREATE INDEX idx_chat_attachments_message_id ON chat_attachments(message_id);

CREATE INDEX idx_chat_presence_room_id ON chat_presence(room_id);
CREATE INDEX idx_chat_presence_user_id ON chat_presence(user_id);
CREATE INDEX idx_chat_presence_is_online ON chat_presence(is_online);

CREATE INDEX idx_chat_typing_indicators_room_id ON chat_typing_indicators(room_id);
CREATE INDEX idx_chat_typing_indicators_is_typing ON chat_typing_indicators(is_typing);

CREATE INDEX idx_chat_read_receipts_message_id ON chat_read_receipts(message_id);
CREATE INDEX idx_chat_read_receipts_user_id ON chat_read_receipts(user_id);

CREATE INDEX idx_chat_pinned_messages_room_id ON chat_pinned_messages(room_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_settings_updated_at 
    BEFORE UPDATE ON chat_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_presence_updated_at 
    BEFORE UPDATE ON chat_presence 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_typing_indicators_updated_at 
    BEFORE UPDATE ON chat_typing_indicators 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pinned_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in rooms they are members of" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in rooms they are members of" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Room admins can delete any message" ON chat_messages;

DROP POLICY IF EXISTS "Users can view reactions in rooms they are members of" ON chat_reactions;
DROP POLICY IF EXISTS "Users can add reactions to messages" ON chat_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON chat_reactions;

DROP POLICY IF EXISTS "Users can view presence in rooms they are members of" ON chat_presence;
DROP POLICY IF EXISTS "Users can update their own presence" ON chat_presence;

DROP POLICY IF EXISTS "Users can view typing indicators in rooms they are members of" ON chat_typing_indicators;
DROP POLICY IF EXISTS "Users can update their own typing status" ON chat_typing_indicators;

DROP POLICY IF EXISTS "Users can view read receipts for messages they can see" ON chat_read_receipts;
DROP POLICY IF EXISTS "Users can mark messages as read" ON chat_read_receipts;

DROP POLICY IF EXISTS "Users can view pinned messages in rooms they are members of" ON chat_pinned_messages;
DROP POLICY IF EXISTS "Room admins can pin/unpin messages" ON chat_pinned_messages;

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

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Room admins can delete any message" ON chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM rooms r 
            WHERE r.id = chat_messages.room_id 
            AND r.admin_id = auth.uid()
        )
    );

-- Chat reactions policies
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

CREATE POLICY "Users can remove their own reactions" ON chat_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Chat presence policies
CREATE POLICY "Users can view presence in rooms they are members of" ON chat_presence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = chat_presence.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own presence" ON chat_presence
    FOR ALL USING (auth.uid() = user_id);

-- Chat typing indicators policies
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

-- Chat read receipts policies
CREATE POLICY "Users can view read receipts for messages they can see" ON chat_read_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages cm
            JOIN room_members rm ON rm.room_id = cm.room_id
            WHERE cm.id = chat_read_receipts.message_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can mark messages as read" ON chat_read_receipts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat pinned messages policies
CREATE POLICY "Users can view pinned messages in rooms they are members of" ON chat_pinned_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM room_members rm 
            WHERE rm.room_id = chat_pinned_messages.room_id 
            AND rm.user_id = auth.uid()
        )
    );

CREATE POLICY "Room admins can pin/unpin messages" ON chat_pinned_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rooms r 
            WHERE r.id = chat_pinned_messages.room_id 
            AND r.admin_id = auth.uid()
        )
    );

-- Insert default chat settings for existing rooms
INSERT INTO chat_settings (room_id, setting_key, setting_value)
SELECT 
    r.id,
    'default_settings',
    '{"enableReactions": true, "enableFileUploads": true, "maxFileSize": 10485760, "allowedFileTypes": ["image/*", "application/pdf", "text/*"], "enableTypingIndicators": true, "enableReadReceipts": true, "enablePinnedMessages": true, "profanityFilter": true, "rateLimit": {"messagesPerMinute": 100}}'::jsonb
FROM rooms r
WHERE NOT EXISTS (
    SELECT 1 FROM chat_settings cs WHERE cs.room_id = r.id AND cs.setting_key = 'default_settings'
);

-- Create function to clean up old presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
    -- Mark users as offline if they haven't been active for more than 5 minutes
    UPDATE chat_presence 
    SET status = 'offline', updated_at = NOW()
    WHERE status = 'online' 
    AND updated_at < NOW() - INTERVAL '5 minutes';
    
    -- Log the cleanup
    RAISE NOTICE 'Cleaned up stale presence records';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup every 2 minutes (optional)
-- You can set this up in Supabase dashboard under Database > Functions > Scheduled Functions
-- SELECT cron.schedule('cleanup-stale-presence', '*/2 * * * *', 'SELECT cleanup_stale_presence();');

-- Create function to get online members for a room
CREATE OR REPLACE FUNCTION get_online_members(room_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.user_id,
        p.full_name as user_name,
        cp.last_seen
    FROM chat_presence cp
    JOIN profiles p ON p.id = cp.user_id
    WHERE cp.room_id = room_uuid 
    AND cp.status = 'online'
    AND cp.updated_at > NOW() - INTERVAL '5 minutes'
    ORDER BY cp.last_seen DESC;
END;
$$ LANGUAGE plpgsql; 