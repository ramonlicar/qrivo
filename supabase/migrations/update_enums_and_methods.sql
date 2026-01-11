-- Create new enum types with the desired values
-- We use DO blocks to avoid errors if types already exist or logic is complex, 
-- but given the error sequence, we'll try a clean approach.

-- 1. Create Types (if they don't exist, though CREATE TYPE IF NOT EXISTS is not standard in all PG versions, 
-- usually we drop or handle exception. For simplicity in this fix loop, we recreate).
DROP TYPE IF EXISTS order_status_new;
DROP TYPE IF EXISTS payment_status_new;

CREATE TYPE order_status_new AS ENUM ('new', 'delivered', 'canceled');
CREATE TYPE payment_status_new AS ENUM ('paid', 'pending', 'refunded');

-- 2. Drop defaults
ALTER TABLE orders ALTER COLUMN order_status DROP DEFAULT;
ALTER TABLE orders ALTER COLUMN payment_status DROP DEFAULT;

-- 3. Convert Types
ALTER TABLE orders 
  ALTER COLUMN order_status TYPE order_status_new 
  USING (
    CASE order_status::text
      WHEN 'new' THEN 'new'::order_status_new
      WHEN 'delivered' THEN 'delivered'::order_status_new
      WHEN 'canceled' THEN 'canceled'::order_status_new
      WHEN 'shipped' THEN 'delivered'::order_status_new 
      ELSE 'new'::order_status_new
    END
  );

ALTER TABLE orders 
  ALTER COLUMN payment_status TYPE payment_status_new 
  USING (
    CASE payment_status::text
      WHEN 'paid' THEN 'paid'::payment_status_new
      WHEN 'pending' THEN 'pending'::payment_status_new
      WHEN 'refunded' THEN 'refunded'::payment_status_new
      ELSE 'pending'::payment_status_new
    END
  );

-- 4. Restore defaults
ALTER TABLE orders ALTER COLUMN order_status SET DEFAULT 'new'::order_status_new;
ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'pending'::payment_status_new;

-- 5. Drop old types and rename new ones (Clean up)
DROP TYPE IF EXISTS order_status;
DROP TYPE IF EXISTS payment_status;

ALTER TYPE order_status_new RENAME TO order_status;
ALTER TYPE payment_status_new RENAME TO payment_status;


-- 6. Ensure payment_method column exists
-- If "payment_method" column missing error occurred, we create it.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 7. Update payment_method constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check CHECK (
  payment_method IN ('pix', 'transfer', 'credit_card', 'debit_card', 'boleto', 'voucher', 'cash', 'other')
);

-- Comments
COMMENT ON COLUMN orders.order_status IS 'new, delivered, canceled';
COMMENT ON COLUMN orders.payment_status IS 'paid, pending, refunded';
COMMENT ON COLUMN orders.payment_method IS 'pix, transfer, credit_card, debit_card, boleto, voucher, cash, other';
