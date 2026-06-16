-- Octopus Market — Supabase schema
-- Run this migration in the Supabase SQL Editor or via the CLI.

-- ────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────

create type wallet_role        as enum ('user', 'admin');
create type wallet_status      as enum ('active', 'suspended');
create type admin_payment_flow as enum ('prediction', 'launch', 'listing');
create type admin_payment_st   as enum ('pending', 'approved', 'rejected');
create type prediction_result  as enum (
  'open', 'pending_review', 'approved_pending_result',
  'win', 'lose', 'claimed', 'rejected'
);
create type ai_listing_status  as enum ('pending', 'approved', 'rejected');
create type ai_listing_badge   as enum ('none', 'blue', 'gold');
create type ai_listing_plan    as enum ('free', 'starter', 'builder');
create type tool_reaction_type as enum ('heart', 'thumbs-up', 'flame');
create type admin_log_action   as enum (
  'create_prediction', 'remove_prediction', 'resolve_prediction',
  'remove_ai', 'approve_listing', 'reject_listing',
  'suspend_user', 'reactivate_user',
  'approve_payment', 'reject_payment', 'add_ai'
);

-- ────────────────────────────────────────────
-- wallets
-- ────────────────────────────────────────────

create table wallets (
  address              text primary key,
  role                 wallet_role    not null default 'user',
  status               wallet_status  not null default 'active',
  username             text,
  display_name         text,
  twitter_handle       text,
  avatar_src           text,
  registered_at        timestamptz,
  first_connected_at   timestamptz    not null default now(),
  last_connected_at    timestamptz    not null default now(),
  connection_count     int            not null default 1,
  latest_activity_at   timestamptz    not null default now(),
  latest_activity_label text          not null default '',
  payment_count        int            not null default 0,
  approved_payment_count int          not null default 0,
  pending_payment_count  int          not null default 0,
  rejected_payment_count int          not null default 0,
  total_paid_usdc      numeric(18,2)  not null default 0,
  total_won_usdc       numeric(18,2)  not null default 0,
  total_lost_usdc      numeric(18,2)  not null default 0,
  total_claimed_usdc   numeric(18,2)  not null default 0
);

-- ────────────────────────────────────────────
-- prediction_markets  (admin-created markets)
-- ────────────────────────────────────────────

create table prediction_markets (
  id                       text primary key,
  category_id              text         not null,
  title                    text         not null,
  market_type              text         not null default 'binary',
  visual_type              text,          -- 'vs' | 'simple'
  resolution_label         text         not null default '',
  event_date_label         text,
  left_competitor_name     text,
  left_competitor_image    text,
  right_competitor_name    text,
  right_competitor_image   text,
  single_name              text,
  single_image             text,
  options                  jsonb        not null default '[]'::jsonb,
  created_by_wallet        text         not null references wallets(address),
  created_at               timestamptz  not null default now(),
  is_admin_created         boolean      not null default true
);

-- ────────────────────────────────────────────
-- prediction_resolutions
-- ────────────────────────────────────────────

create table prediction_resolutions (
  market_id           text primary key references prediction_markets(id) on delete cascade,
  outcome_id          text         not null,
  resolved_at         timestamptz  not null default now(),
  resolved_by_wallet  text         not null references wallets(address)
);

-- ────────────────────────────────────────────
-- prediction_bets  (user bet history)
-- ────────────────────────────────────────────

create table prediction_bets (
  id                     text primary key,
  market_id              text         not null,
  market_title           text         not null,
  category_label         text         not null default '',
  selection_id           text         not null,
  selection_label        text         not null,
  amount                 numeric(18,2) not null,
  reserve_fee            numeric(18,2) not null default 0,
  total_charged          numeric(18,2) not null default 0,
  claim_fee_rate         numeric(5,2)  not null default 5,
  payout_multiple        numeric(8,4)  not null default 1,
  gross_reward           numeric(18,2) not null default 0,
  net_reward             numeric(18,2) not null default 0,
  wallet_address         text         not null,
  payment_reference      text         not null,
  payment_request_id     text         not null,
  created_at             timestamptz  not null default now(),
  reported_at            timestamptz  not null default now(),
  admin_decision_status  admin_payment_st default 'pending',
  resolution_outcome_id  text,
  resolved_at            timestamptz,
  resolved_by_wallet     text,
  result_status          prediction_result default 'open',
  winning_choice_label   text,
  payout_recorded_at     timestamptz,
  claimed_at             timestamptz,
  claim_reference        text
);

create index idx_bets_market    on prediction_bets(market_id);
create index idx_bets_wallet    on prediction_bets(wallet_address);
create index idx_bets_payment   on prediction_bets(payment_reference);

-- ────────────────────────────────────────────
-- admin_notifications  (payment review queue)
-- ────────────────────────────────────────────

create table admin_notifications (
  id                  text primary key,
  payment_request_id  text         not null,
  payment_reference   text         not null,
  flow                admin_payment_flow not null,
  title               text         not null,
  subtitle            text,
  category_label      text,
  market_id           text,
  selection_id        text,
  selection_label     text,
  username            text,
  user_wallet         text         not null,
  recipient_wallet    text         not null,
  amount_usdc         numeric(18,2) not null,
  reserve_fee_usdc    numeric(18,2) not null default 0,
  total_paid_usdc     numeric(18,2) not null default 0,
  created_at          timestamptz  not null default now(),
  status              admin_payment_st not null default 'pending',
  reviewed_at         timestamptz,
  reviewed_by_wallet  text
);

create index idx_notif_ref on admin_notifications(payment_reference);

-- ────────────────────────────────────────────
-- ai_listings
-- ────────────────────────────────────────────

create table ai_listings (
  id                  text primary key,
  wallet_address      text         not null,
  display_name        text         not null default '',
  twitter_handle      text         not null default '',
  icon_src            text         not null default '',
  icon_name           text         not null default '',
  website_url         text         not null default '',
  description         text         not null default '',
  social_url          text         not null default '',
  guide_file_name     text         not null default '',
  guide_file_url      text         not null default '',
  plan_id             ai_listing_plan not null default 'starter',
  billing_label       text         not null default '$0 / free',
  amount_usd          numeric(18,2) not null default 0,
  auto_renew_enabled  boolean      not null default false,
  submitted_at        timestamptz  not null default now(),
  updated_at          timestamptz  not null default now(),
  status              ai_listing_status not null default 'pending',
  badge               ai_listing_badge  not null default 'none',
  admin_notes         text,
  payment_reference   text,
  payment_request_id  text,
  visible_in_explore  boolean      not null default true,
  visitor_count       int          not null default 0,
  unique_visitor_keys text[]       not null default '{}'
);

create index idx_listings_wallet on ai_listings(wallet_address);
create index idx_listings_status on ai_listings(status);

-- ────────────────────────────────────────────
-- tool_social  (ratings, reactions, comments)
-- ────────────────────────────────────────────

create table tool_ratings (
  tool_name   text   not null,
  actor_key   text   not null,
  rating      int    not null check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  primary key (tool_name, actor_key)
);

create table tool_reactions (
  tool_name   text              not null,
  actor_key   text              not null,
  reaction    tool_reaction_type not null,
  created_at  timestamptz       not null default now(),
  primary key (tool_name, actor_key)
);

create table tool_comments (
  id          text primary key default gen_random_uuid()::text,
  tool_name   text   not null,
  author      text   not null,
  content     text   not null,
  created_at  timestamptz not null default now()
);

create index idx_comments_tool on tool_comments(tool_name);

create table tool_reports (
  id          text primary key default gen_random_uuid()::text,
  tool_name   text not null,
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────
-- admin_logs
-- ────────────────────────────────────────────

create table admin_logs (
  id            text primary key,
  admin_wallet  text           not null,
  action        admin_log_action not null,
  target_id     text           not null,
  details       text           not null default '',
  created_at    timestamptz    not null default now()
);

-- ────────────────────────────────────────────
-- Row Level Security (RLS)
-- ────────────────────────────────────────────

-- Enable RLS on all tables
alter table wallets               enable row level security;
alter table prediction_markets    enable row level security;
alter table prediction_resolutions enable row level security;
alter table prediction_bets       enable row level security;
alter table admin_notifications   enable row level security;
alter table ai_listings           enable row level security;
alter table tool_ratings          enable row level security;
alter table tool_reactions        enable row level security;
alter table tool_comments         enable row level security;
alter table tool_reports          enable row level security;
alter table admin_logs            enable row level security;

-- Public read access (the app uses anon key for reads)
create policy "Public read wallets"          on wallets               for select using (true);
create policy "Public read markets"          on prediction_markets    for select using (true);
create policy "Public read resolutions"      on prediction_resolutions for select using (true);
create policy "Public read bets"             on prediction_bets       for select using (true);
create policy "Public read notifications"    on admin_notifications   for select using (true);
create policy "Public read listings"         on ai_listings           for select using (true);
create policy "Public read ratings"          on tool_ratings          for select using (true);
create policy "Public read reactions"        on tool_reactions        for select using (true);
create policy "Public read comments"         on tool_comments         for select using (true);
create policy "Public read reports"          on tool_reports          for select using (true);
create policy "Public read admin_logs"       on admin_logs            for select using (true);

-- Public write access via anon key (wallet auth is handled at the app level)
create policy "Anon insert wallets"          on wallets               for insert with check (true);
create policy "Anon update wallets"          on wallets               for update using (true);
create policy "Anon insert markets"          on prediction_markets    for insert with check (true);
create policy "Anon delete markets"          on prediction_markets    for delete using (true);
create policy "Anon insert resolutions"      on prediction_resolutions for insert with check (true);
create policy "Anon update resolutions"      on prediction_resolutions for update using (true);
create policy "Anon insert bets"             on prediction_bets       for insert with check (true);
create policy "Anon update bets"             on prediction_bets       for update using (true);
create policy "Anon insert notifications"    on admin_notifications   for insert with check (true);
create policy "Anon update notifications"    on admin_notifications   for update using (true);
create policy "Anon insert listings"         on ai_listings           for insert with check (true);
create policy "Anon update listings"         on ai_listings           for update using (true);
create policy "Anon insert ratings"          on tool_ratings          for insert with check (true);
create policy "Anon update ratings"          on tool_ratings          for update using (true);
create policy "Anon insert reactions"        on tool_reactions        for insert with check (true);
create policy "Anon update reactions"        on tool_reactions        for update using (true);
create policy "Anon insert comments"         on tool_comments         for insert with check (true);
create policy "Anon insert reports"          on tool_reports          for insert with check (true);
create policy "Anon insert admin_logs"       on admin_logs            for insert with check (true);

-- Enable Realtime on key tables
alter publication supabase_realtime add table prediction_markets;
alter publication supabase_realtime add table prediction_resolutions;
alter publication supabase_realtime add table prediction_bets;
alter publication supabase_realtime add table admin_notifications;
alter publication supabase_realtime add table ai_listings;
alter publication supabase_realtime add table tool_ratings;
alter publication supabase_realtime add table tool_reactions;
alter publication supabase_realtime add table tool_comments;
