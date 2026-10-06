import { logger } from '../../utils/logger';
import { fixtureResponse } from './fixtures';
import { env } from '../../config/env';
import { getLeagueByName, SUPPORTED_LEAGUES } from './leagues';
import { Fixture, TeamStats, Standing, HeadToHead, Team, Injury } from './types';

const API_BASE_URL = 'https://v3.football.api-sports.io';

interface ApiResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: Record<string, string> | any[];
  results: number;
  paging: { current: number; total: number };
  response: T;
}

interface ApiFootballTeamSearchItem {
  team: Team;
}

interface ApiFootballStandingResponseItem {
  league: { standings: Standing[][] };
}

interface ApiFootballTeamLeagueItem {
  league: { id: number; season: number; type: string };
}

export class ApiFootballClient {
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTtl: number;

  constructor() {
    this.apiKey = env.API_FOOTBALL_KEY;
    this.cacheTtl = env.CACHE_TTL_SECONDS * 1000;
  }

  private async makeRequest<T>(
    endpoint: string, 
    params: Record<string, string> = {},
    retries = 3
  ): Promise<T> {
    if (env.FIXTURE_MODE) return fixtureResponse(endpoint, params) as T;
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      logger.debug('Cache hit for', cacheKey);
      return cached.data;
    }

    const url = new URL(endpoint, API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        logger.debug(`API request to ${endpoint} (attempt ${attempt}/${retries})`);
        
        const response = await fetch(url.toString(), {
          headers: {
            // Official API-SPORTS header for direct API-Football accounts.
            'x-apisports-key': this.apiKey
          },
          signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
          if (response.status === 429) {
            logger.warn('Rate limit hit, waiting before retry');
            await this.sleep(1000 * attempt);
            continue;
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as ApiResponse<T>;

        const hasErrors = Array.isArray(data.errors)
          ? data.errors.length > 0
          : !!data.errors && Object.keys(data.errors).length > 0;
        if (hasErrors) {
          const errorMessage = Array.isArray(data.errors)
            ? data.errors.join(', ')
            : Object.entries(data.errors).map(([k, v]) => `${k}: ${v}`).join(', ');
          throw new Error(`API_FOOTBALL_ERROR: ${errorMessage}`);
        }

        // Cache the result
        this.cache.set(cacheKey, { data: data.response, timestamp: Date.now() });
        
        logger.debug(`API request successful: ${endpoint}`, { results: data.results });
        return data.response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Request failed (attempt ${attempt}/${retries}):`, lastError.message);
        
        if (attempt < retries) {
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCurrentSeason(): number {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    // Football season label is the starting year (e.g. 2025 for 2025/26).
    return month >= 7 ? year : year - 1;
  }

  async getUpcomingFixtures(team1Name: string, team2Name: string): Promise<Fixture[]> {
    try {
      // First, search for teams to get their IDs
      const [team1] = await this.searchTeams(team1Name);
      const [team2] = await this.searchTeams(team2Name);

      if (!team1 || !team2) {
        logger.warn('Could not find team IDs', { team1Name, team2Name });
        return [];
      }

      // Get upcoming fixtures for both teams
      const currentSeason = this.getCurrentSeason();
      const fixtures = await this.makeRequest<Fixture[]>('/fixtures', {
        season: currentSeason.toString(),
        team: team1.id.toString(),
        next: '5'
      });

      // Filter for matches between these two teams
      return fixtures.filter(f => 
        f.teams.home.id === team2.id || f.teams.away.id === team2.id
      );
    } catch (error) {
      logger.error('Failed to get upcoming fixtures', error);
      return [];
    }
  }

  async getTeamStats(teamName: string): Promise<TeamStats | null> {
    try {
      const [team] = await this.searchTeams(teamName);
      if (!team) {
        logger.warn(`Team not found: ${teamName}`);
        return null;
      }

      const currentSeason = this.getCurrentSeason();
      const seasonsToTry = [currentSeason, currentSeason - 1];
      const primaryLeagueId = await this.getPrimaryLeagueIdForTeam(team.id, currentSeason);
      const leagueIdsToTry = [primaryLeagueId, ...SUPPORTED_LEAGUES.map((l) => l.id)]
        .filter((v, i, arr) => arr.indexOf(v) === i);

      for (const season of seasonsToTry) {
        for (const leagueId of leagueIdsToTry) {
          try {
            const stats = await this.makeRequest<TeamStats>('/teams/statistics', {
              season: season.toString(),
              league: leagueId.toString(),
              team: team.id.toString()
            });
            if (stats?.fixtures?.played?.total && stats.fixtures.played.total > 0) {
              return stats;
            }
          } catch {
            // Keep trying fallbacks.
          }
        }
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get team stats for ${teamName}`, error);
      return null;
    }
  }

  async getHeadToHead(team1Name: string, team2Name: string): Promise<HeadToHead> {
    try {
      const [team1] = await this.searchTeams(team1Name);
      const [team2] = await this.searchTeams(team2Name);

      if (!team1 || !team2) {
        return { fixtures: [], summary: { team1Wins: 0, team2Wins: 0, draws: 0, totalMatches: 0 } };
      }

      const fixtures = await this.makeRequest<Fixture[]>('/fixtures/headtohead', {
        h2h: `${team1.id}-${team2.id}`,
        last: '10'
      });

      // Calculate summary
      let team1Wins = 0, team2Wins = 0, draws = 0;
      fixtures.forEach(f => {
        if (f.goals) {
          const t1IsHome = f.teams.home.id === team1.id;
          const t1Goals = t1IsHome ? f.goals.home : f.goals.away;
          const t2Goals = t1IsHome ? f.goals.away : f.goals.home;

          if (t1Goals !== null && t2Goals !== null) {
            if (t1Goals > t2Goals) team1Wins++;
            else if (t2Goals > t1Goals) team2Wins++;
            else draws++;
          }
        }
      });

      return {
        fixtures,
        summary: {
          team1Wins,
          team2Wins,
          draws,
          totalMatches: fixtures.length
        }
      };
    } catch (error) {
      logger.error('Failed to get head to head data', error);
      return { fixtures: [], summary: { team1Wins: 0, team2Wins: 0, draws: 0, totalMatches: 0 } };
    }
  }

  async getStandings(leagueName?: string, seasonOverride?: number): Promise<Standing[]> {
    try {
      let leagueId: number;
      
      if (leagueName) {
        const league = getLeagueByName(leagueName);
        if (!league) {
          logger.warn(`League not found: ${leagueName}`);
          return [];
        }
        leagueId = league.id;
      } else {
        // Default to Champions League if no league specified
        leagueId = 2;
      }

      const seasonsToTry = seasonOverride
        ? [seasonOverride]
        : [this.getCurrentSeason(), this.getCurrentSeason() - 1];
      for (const season of seasonsToTry) {
        try {
          const response = await this.makeRequest<ApiFootballStandingResponseItem[]>('/standings', {
            season: season.toString(),
            league: leagueId.toString()
          });
          const standings = response[0]?.league.standings[0] || [];
          if (standings.length > 0) {
            return standings;
          }
        } catch (error) {
          if (seasonOverride && error instanceof Error && error.message.includes('Free plans do not have access to this season')) {
            throw new Error(error.message);
          }
          // Try next season fallback.
        }
      }
      return [];
    } catch (error) {
      logger.error('Failed to get standings', error);
      if (seasonOverride && error instanceof Error && error.message.includes('Free plans do not have access to this season')) {
        throw error;
      }
      return [];
    }
  }

  async getInjuries(teamName: string): Promise<Injury[]> {
    try {
      const [team] = await this.searchTeams(teamName);
      if (!team) return [];

      const currentSeason = this.getCurrentSeason();
      const injuries = await this.makeRequest<Injury[]>('/injuries', {
        season: currentSeason.toString(),
        team: team.id.toString()
      });

      return injuries;
    } catch (error) {
      logger.error(`Failed to get injuries for ${teamName}`, error);
      return [];
    }
  }

  async searchTeams(query: string): Promise<Team[]> {
    try {
      const teams = await this.makeRequest<ApiFootballTeamSearchItem[]>('/teams', {
        search: query
      });
      return teams.map((entry) => entry.team);
    } catch (error) {
      logger.error(`Failed to search teams: ${query}`, error);
      return [];
    }
  }

  private async getPrimaryLeagueIdForTeam(teamId: number, season: number): Promise<number> {
    try {
      const leagues = await this.makeRequest<ApiFootballTeamLeagueItem[]>('/leagues', {
        team: teamId.toString(),
        season: season.toString(),
        current: 'true'
      });
      const preferred = leagues.find((l) => l.league.type === 'League') ?? leagues[0];
      return preferred?.league.id ?? 39;
    } catch {
      // Safe fallback if lookup fails.
      return 39;
    }
  }

  extractTeamsFromQuery(query: string, leagueHint?: string): Promise<{ team1: string | null; team2: string | null }> {
    // This is a simple extraction - in production, you might want to use NLP or
    // maintain a database of team names for fuzzy matching
    
    const lowerQuery = query.toLowerCase();
    
    // Common patterns
    const patterns = [
      /(\w+(?:\s+\w+)*)\s+(?:vs\.?|versus|against|@)\s+(\w+(?:\s+\w+)*)/i,
      /(\w+(?:\s+\w+)*)\s+(?:and|&)\s+(\w+(?:\s+\w+)*)/i,
      /predict\s+(\w+(?:\s+\w+)*)\s+(?:vs\.?|versus)?\s*(\w+(?:\s+\w+)*)/i,
      /who\s+(?:will\s+)?win\s+(?:between\s+)?(\w+(?:\s+\w+)*)\s+(?:and|vs\.?|versus)?\s*(\w+(?:\s+\w+)*)/i,
    ];

    for (const pattern of patterns) {
      const match = lowerQuery.match(pattern);
      if (match) {
        const team1 = this.sanitizeTeamPhrase(match[1]);
        const team2 = this.sanitizeTeamPhrase(match[2] || '');
        
        if (team1 && team2) {
          return Promise.resolve({ team1, team2 });
        }
      }
    }

    // Try to find team names in the query by checking known teams
    // This is a fallback for when regex patterns don't match
    const knownTeams = [
      'real madrid', 'barcelona', 'atletico', 'manchester united', 'manchester city', 
      'liverpool', 'arsenal', 'chelsea', 'tottenham', 'bayern munich', 'borussia dortmund',
      'juventus', 'inter', 'ac milan', 'napoli', 'roma', 'paris saint-germain', 'lyon',
      'marseille', 'monaco', 'al ahly', 'es setif', 'mouloudia', 'raja casablanca'
    ];

    const foundTeams: string[] = [];
    for (const team of knownTeams) {
      if (lowerQuery.includes(team)) {
        foundTeams.push(this.capitalizeTeamName(team));
      }
    }

    if (foundTeams.length >= 2) {
      return Promise.resolve({ team1: foundTeams[0], team2: foundTeams[1] });
    }

    return Promise.resolve({ team1: null, team2: null });
  }

  private capitalizeTeamName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private sanitizeTeamPhrase(raw: string): string {
    const noiseWords = new Set([
      'prediction', 'predict', 'match', 'game', 'today', 'tomorrow',
      'please', 'result', 'odds', 'for', 'the', 'a', 'an'
    ]);
    const cleaned = raw
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .filter((word) => !noiseWords.has(word))
      .join(' ')
      .trim();
    return this.capitalizeTeamName(cleaned);
  }
}
