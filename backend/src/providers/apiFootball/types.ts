export interface Team {
  id: number;
  name: string;
  logo?: string;
}

export interface Fixture {
  id: number;
  date: string;
  timestamp: number;
  status: {
    short: string;
    long: string;
  };
  league: {
    id: number;
    name: string;
  };
  teams: {
    home: Team;
    away: Team;
  };
  goals?: {
    home: number | null;
    away: number | null;
  };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
  };
}

export interface TeamStats {
  team: Team;
  form: string;  // e.g., "WWDLW"
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { home: { total: number; average: string }; away: { total: number; average: string }; total: { total: number; average: string } };
    against: { home: { total: number; average: string }; away: { total: number; average: string }; total: { total: number; average: string } };
  };
}

export interface Standing {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

export interface HeadToHead {
  fixtures: Fixture[];
  summary: {
    team1Wins: number;
    team2Wins: number;
    draws: number;
    totalMatches: number;
  };
}

export interface Injury {
  player: {
    id: number;
    name: string;
  };
  team: Team;
  fixture: {
    id: number;
    date: string;
  };
  league: {
    id: number;
    name: string;
  };
  update: string;
  type?: string;
  reason?: string;
  status: string;
}
