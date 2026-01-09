-- Diagnostic: Check membership_role enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'membership_role'::regtype;
