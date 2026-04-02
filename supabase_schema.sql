-- VAL Analytics Platform - Supabase Initial Schema (PostgreSQL)
-- Paste this into the Supabase SQL Editor

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    name VARCHAR(100),
    tag VARCHAR(10),
    region VARCHAR(10),
    plan VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Players
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    riot_id VARCHAR(100),
    puuid VARCHAR(100) UNIQUE,
    display_name VARCHAR(100),
    role VARCHAR(30),
    role_inferred BOOLEAN DEFAULT TRUE,
    rso_linked BOOLEAN DEFAULT FALSE,
    rso_access_token TEXT,
    rso_refresh_token TEXT,
    active BOOLEAN DEFAULT TRUE,
    joined_at DATE DEFAULT CURRENT_DATE,
    left_at DATE
);

-- 4. Matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    riot_match_id VARCHAR(100) UNIQUE,
    type VARCHAR(10),
    date TIMESTAMP WITH TIME ZONE,
    map_id VARCHAR(50),
    map_name VARCHAR(50),
    result VARCHAR(1),
    team_rounds_won INTEGER,
    team_rounds_lost INTEGER,
    defense_rounds_won INTEGER,
    attack_rounds_won INTEGER,
    def_pistol VARCHAR(1),
    att_pistol VARCHAR(1),
    opponent_name VARCHAR(100),
    opponent_tier VARCHAR(5),
    composition TEXT, -- Guardado como string/JSON
    vod_link VARCHAR(500),
    notes TEXT,
    data_source VARCHAR(10),
    api_fetched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Match Player Stats
CREATE TABLE IF NOT EXISTS match_player_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    player_id UUID REFERENCES players(id),
    agent VARCHAR(50),
    acs INTEGER,
    kills INTEGER,
    deaths INTEGER,
    assists INTEGER,
    first_bloods INTEGER,
    first_deaths INTEGER,
    hs_pct NUMERIC(5,2),
    kast_pct NUMERIC(5,2),
    adr NUMERIC(7,2),
    score INTEGER,
    multikill_2k INTEGER,
    multikill_3k INTEGER,
    multikill_4k INTEGER,
    multikill_5k INTEGER,
    clutches_won INTEGER,
    clutch_opportunities INTEGER,
    plants INTEGER,
    defuses INTEGER
);

-- 6. Rounds
CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    round_number INTEGER,
    winning_team VARCHAR(10),
    end_type VARCHAR(20),
    ceremony VARCHAR(20),
    team_buy_type VARCHAR(20),
    opponent_buy_type VARCHAR(20)
);

-- 7. Round Events
CREATE TABLE IF NOT EXISTS round_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID REFERENCES rounds(id),
    match_id UUID REFERENCES matches(id),
    event_type VARCHAR(20),
    timestamp_ms INTEGER,
    actor_player_id UUID REFERENCES players(id),
    victim_player_id UUID REFERENCES players(id),
    weapon VARCHAR(50),
    finishing_damage_type VARCHAR(20),
    is_first_blood BOOLEAN DEFAULT FALSE,
    is_first_death BOOLEAN DEFAULT FALSE,
    kill_order_in_round INTEGER,
    assistants JSONB
);

-- 8. API Cache
CREATE TABLE IF NOT EXISTS api_cache (
    puuid VARCHAR(100),
    match_id VARCHAR(100),
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (puuid, match_id)
);
