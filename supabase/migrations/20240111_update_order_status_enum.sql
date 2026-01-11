-- Add new statuses to order_status enum
-- We use a DO block to safely add values if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'confirmed') THEN
        ALTER TYPE order_status ADD VALUE 'confirmed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'preparing') THEN
        ALTER TYPE order_status ADD VALUE 'preparing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'order_status' AND e.enumlabel = 'shipped') THEN
        ALTER TYPE order_status ADD VALUE 'shipped';
    END IF;
END
$$;

-- Comments to reflect new statuses
COMMENT ON COLUMN orders.order_status IS 'new, confirmed, preparing, shipped, delivered, canceled, archived';
