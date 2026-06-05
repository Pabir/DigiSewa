-- SQL script to add new categories to the 'categories' table.
-- Run this in your Supabase SQL Editor.

INSERT INTO categories (name, name_bn, name_hi, description) VALUES
('Tax Consultant', 'কর উপদেষ্টা', 'कर सलाहकार', 'Professional tax and financial consulting services.'),
('Decorator/Event Planner', 'ডেকোরেটর/ইভেন্ট প্ল্যানার', 'डेकोरेटर/इवेंट प्लानर', 'Expert decoration and event planning for all occasions.'),
('Interior Design', 'ইন্টেরিয়র ডিজাইন', 'इंटीरियर डिजाइन', 'Transform your spaces with professional interior design.');
