-- Add user_id column to therapists table if it doesn't exist
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create a unique index on user_id to ensure one therapist profile per user
CREATE UNIQUE INDEX IF NOT EXISTS therapists_user_id_idx ON therapists(user_id) WHERE user_id IS NOT NULL;
