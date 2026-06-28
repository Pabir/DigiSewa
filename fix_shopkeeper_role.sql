-- Run this in your Supabase SQL Editor to fix the shopkeeper signup error.
-- It adds 'shopkeeper' to the list of allowed roles in the database.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shopkeeper';
