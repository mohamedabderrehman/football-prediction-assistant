export interface LeagueInfo {
  id: number;
  name: string;
  country: string;
  type: 'League' | 'Cup';
  season: number;
}

// Target leagues with their API-Football IDs
export const SUPPORTED_LEAGUES: LeagueInfo[] = [
  {
    id: 2,  // API-Football league ID
    name: 'UEFA Champions League',
    country: 'World',
    type: 'Cup',
    season: 2024
  },
  {
    id: 39,
    name: 'Premier League',
    country: 'England',
    type: 'League',
    season: 2024
  },
  {
    id: 140,
    name: 'La Liga',
    country: 'Spain',
    type: 'League',
    season: 2024
  },
  {
    id: 78,
    name: 'Bundesliga',
    country: 'Germany',
    type: 'League',
    season: 2024
  },
  {
    id: 135,
    name: 'Serie A',
    country: 'Italy',
    type: 'League',
    season: 2024
  },
  {
    id: 61,
    name: 'Ligue 1',
    country: 'France',
    type: 'League',
    season: 2024
  },
  {
    id: 132,
    name: 'Algerian Ligue 1',
    country: 'Algeria',
    type: 'League',
    season: 2024
  }
];

export const getSupportedLeagues = (): LeagueInfo[] => SUPPORTED_LEAGUES;

export const getLeagueByName = (name: string): LeagueInfo | undefined => {
  const normalizedName = name.toLowerCase().trim();
  return SUPPORTED_LEAGUES.find(league => 
    league.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(league.name.toLowerCase().split(' ')[0])
  );
};

export const getLeagueById = (id: number): LeagueInfo | undefined => {
  return SUPPORTED_LEAGUES.find(league => league.id === id);
};
