CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(50) UNIQUE NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    avatar_url        TEXT,
    status            VARCHAR(20) DEFAULT 'active',
    last_login_at     TIMESTAMP,
    last_login_ip     INET,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    access_token      VARCHAR(500) NOT NULL,
    refresh_token     VARCHAR(500) NOT NULL,
    user_agent        TEXT,
    ip_address        INET,
    expires_at        TIMESTAMP NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    name_en           VARCHAR(100),
    platform          VARCHAR(20) NOT NULL,
    cover_url         TEXT,
    rom_url           TEXT NOT NULL,
    rom_size          BIGINT,
    rom_md5           VARCHAR(32),
    emulator_core     VARCHAR(50),
    category          VARCHAR(50),
    tags              TEXT[],
    description       TEXT,
    release_year      INTEGER,
    publisher         VARCHAR(100),
    play_count        INTEGER DEFAULT 0,
    favorite_count    INTEGER DEFAULT 0,
    status            VARCHAR(20) DEFAULT 'active',
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_favorites (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

CREATE TABLE user_recent_games (
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,
    last_played_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id)
);

CREATE TABLE cloud_saves (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id) ON DELETE CASCADE,
    platform          VARCHAR(20) NOT NULL,
    slot_id           INTEGER NOT NULL,
    save_name         VARCHAR(100),
    save_data         TEXT NOT NULL,
    screenshot_url    TEXT,
    play_time         INTEGER DEFAULT 0,
    is_auto_save      BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id, platform, slot_id)
);

CREATE TABLE cloud_screenshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,
    screenshot_url    TEXT NOT NULL,
    thumbnail_url     TEXT,
    width             INTEGER,
    height            INTEGER,
    file_size         INTEGER,
    is_public         BOOLEAN DEFAULT FALSE,
    description       TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cloud_recordings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id           UUID REFERENCES games(id),
    platform          VARCHAR(20) NOT NULL,
    title             VARCHAR(200),
    video_url         TEXT NOT NULL,
    thumbnail_url     TEXT,
    duration          INTEGER,
    file_size         BIGINT,
    status            VARCHAR(20) DEFAULT 'processing',
    is_public         BOOLEAN DEFAULT FALSE,
    play_count        INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_play_count ON games(play_count DESC);
CREATE INDEX idx_cloud_saves_user_game_platform ON cloud_saves(user_id, game_id, platform);
CREATE INDEX idx_screenshots_user_platform ON cloud_screenshots(user_id, platform);
CREATE INDEX idx_recordings_user_platform ON cloud_recordings(user_id, platform);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);
