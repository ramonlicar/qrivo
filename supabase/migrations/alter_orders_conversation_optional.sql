-- Make conversation_id optional in orders table
ALTER TABLE orders ALTER COLUMN conversation_id DROP NOT NULL;
