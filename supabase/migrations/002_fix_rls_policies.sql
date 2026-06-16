-- Fix missing RLS policies that block upsert/delete operations
-- Run this migration in the Supabase SQL Editor after 001_initial_schema.sql

-- prediction_markets was missing UPDATE policy (required for upsert ON CONFLICT)
create policy "Anon update markets" on prediction_markets for update using (true);

-- wallets was missing DELETE policy
create policy "Anon delete wallets" on wallets for delete using (true);

-- prediction_bets was missing DELETE policy
create policy "Anon delete bets" on prediction_bets for delete using (true);

-- admin_notifications was missing DELETE policy
create policy "Anon delete notifications" on admin_notifications for delete using (true);

-- ai_listings was missing DELETE policy
create policy "Anon delete listings" on ai_listings for delete using (true);

-- admin_logs was missing UPDATE and DELETE policies
create policy "Anon update admin_logs" on admin_logs for update using (true);
create policy "Anon delete admin_logs" on admin_logs for delete using (true);

-- tool_ratings was missing UPDATE and DELETE policies
create policy "Anon update ratings" on tool_ratings for update using (true);
create policy "Anon delete ratings" on tool_ratings for delete using (true);

-- tool_reactions was missing UPDATE and DELETE policies
create policy "Anon update reactions" on tool_reactions for update using (true);
create policy "Anon delete reactions" on tool_reactions for delete using (true);

-- tool_comments was missing UPDATE and DELETE policies
create policy "Anon update comments" on tool_comments for update using (true);
create policy "Anon delete comments" on tool_comments for delete using (true);

-- tool_reports was missing UPDATE and DELETE policies
create policy "Anon update reports" on tool_reports for update using (true);
create policy "Anon delete reports" on tool_reports for delete using (true);

-- prediction_resolutions was missing DELETE policy
create policy "Anon delete resolutions" on prediction_resolutions for delete using (true);
