-- Create links table in Supabase
CREATE TABLE links (
  id TEXT PRIMARY KEY,
  data_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_links_created_at ON links(created_at);

-- Enable Row Level Security (optional)
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON links
  FOR SELECT
  USING (true);

-- Allow public insert
CREATE POLICY "Allow public insert" ON links
  FOR INSERT
  WITH CHECK (true);
