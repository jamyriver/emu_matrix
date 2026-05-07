export type Platform = 'nes' | 'md' | 'snes' | 'gb' | 'gba';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
}

export interface Game {
  id: string;
  name: string;
  name_en: string | null;
  platform: Platform;
  cover_url: string | null;
  rom_url: string;
  rom_size: number | null;
  rom_md5: string | null;
  emulator_core: string | null;
  category: string | null;
  tags: string[] | null;
  description: string | null;
  release_year: number | null;
  publisher: string | null;
  play_count: number;
  favorite_count: number;
  status: string;
  created_at: string;
}

export interface UserFavorite {
  user_id: string;
  game_id: string;
  created_at: string;
}

export interface UserRecentGame {
  user_id: string;
  game_id: string;
  platform: Platform;
  last_played_at: string;
}

export interface CloudSave {
  id: string;
  user_id: string;
  game_id: string;
  platform: Platform;
  slot_id: number;
  save_name: string | null;
  save_data: string;
  screenshot_url: string | null;
  play_time: number;
  is_auto_save: boolean;
  created_at: string;
  updated_at: string;
}

export interface CloudScreenshot {
  id: string;
  user_id: string;
  game_id: string | null;
  platform: Platform;
  screenshot_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  is_public: boolean;
  description: string | null;
  created_at: string;
}

export interface CloudRecording {
  id: string;
  user_id: string;
  game_id: string | null;
  platform: Platform;
  title: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  file_size: number | null;
  status: 'processing' | 'ready' | 'failed';
  is_public: boolean;
  play_count: number;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GameListQuery {
  page?: number;
  pageSize?: number;
  platform?: Platform;
  category?: string;
  search?: string;
}

export interface SaveQuery {
  gameId?: string;
  platform?: Platform;
}

export interface ScreenshotQuery {
  platform?: Platform;
  page?: number;
  pageSize?: number;
}

export interface RecordingQuery {
  platform?: Platform;
  page?: number;
  pageSize?: number;
}

export interface CreateSaveRequest {
  game_id: string;
  platform: Platform;
  slot_id: number;
  save_name?: string;
  save_data: string;
  screenshot_url?: string;
  play_time?: number;
  is_auto_save?: boolean;
}

export interface CreateScreenshotRequest {
  game_id?: string;
  platform: Platform;
  screenshot_url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  file_size?: number;
  is_public?: boolean;
  description?: string;
}

export interface CreateRecordingRequest {
  game_id?: string;
  platform: Platform;
  title?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size?: number;
  is_public?: boolean;
}

export interface RoomEvent {
  type: 'create' | 'join' | 'leave' | 'offer' | 'answer' | 'ice-candidate';
  roomId: string;
  userId: string;
  payload?: unknown;
}

export type RomFormat = 'gb' | 'gbc' | 'gba' | 'nes' | 'md' | 'sfc' | 'smc';

export interface RomValidationResult {
  valid: boolean;
  platform: Platform | null;
  format: RomFormat | null;
  error?: string;
}

export interface PlatformControlMapping {
  platform: Platform;
  dpad: boolean;
  buttons: string[];
  triggers?: string[];
  startSelect: boolean;
}
