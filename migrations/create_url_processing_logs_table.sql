-- Create the url_processing_logs table
CREATE TABLE IF NOT EXISTS url_processing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add indexes for faster queries
  CONSTRAINT url_processing_logs_type_check CHECK (
    type IN ('start', 'info', 'api_request', 'api_response', 'error', 'end')
  )
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS url_processing_logs_url_id_idx ON url_processing_logs(url_id);
CREATE INDEX IF NOT EXISTS url_processing_logs_type_idx ON url_processing_logs(type);
CREATE INDEX IF NOT EXISTS url_processing_logs_created_at_idx ON url_processing_logs(created_at);

-- Add RLS policies
ALTER TABLE url_processing_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own logs
CREATE POLICY url_processing_logs_select_policy
  ON url_processing_logs
  FOR SELECT
  USING (
    url_id IN (
      SELECT id FROM urls WHERE user_id = auth.uid()
    )
  );

-- Policy to allow the service role to insert logs
CREATE POLICY url_processing_logs_insert_policy
  ON url_processing_logs
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions to authenticated users and service role
GRANT SELECT ON url_processing_logs TO authenticated;
GRANT INSERT, SELECT ON url_processing_logs TO service_role; 