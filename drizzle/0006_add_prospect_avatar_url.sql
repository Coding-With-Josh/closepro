-- Add optional human-style portrait URL for prospects (e.g. NanoBanana)
ALTER TABLE prospect_avatars ADD COLUMN IF NOT EXISTS avatar_url text;
