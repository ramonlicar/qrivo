DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_policies 
        WHERE tablename = 'customers' AND policyname = 'Users can delete customers of their company'
    ) THEN
        CREATE POLICY "Users can delete customers of their company" ON customers
          FOR DELETE
          USING (auth.uid() IN (
            SELECT user_id FROM memberships WHERE company_id = customers.company_id
          ));
    END IF;
END $$;
