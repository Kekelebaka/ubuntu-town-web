-- Add display_name to coordinators table
-- This fixes the TypeScript error in town/[slug]/page.tsx

alter table coordinators add column display_name text;alter table coordinators add column phone text;-- Update existing coordinators with placeholder display names
update coordinators set display_name = 'Coordinator' where display_name is null