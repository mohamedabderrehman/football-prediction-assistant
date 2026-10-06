import { describe, it, expect } from 'vitest';
import { buildFeatures, generatePredictionScore } from '../../src/prediction/featureBuilder';
import { FeatureInput, MatchFeatures } from '../../src/prediction/types';
import { HeadToHead, TeamStats, Standing, Fixture } from '../../src/providers/apiFootball/types';

// Mock data helpers
const createMockTeamStats = (overrides?: Partial<TeamStats>): TeamStats => ({
  team: { id: 1, name: 'Test Team', logo: '' },
  form: 'WWDLW',
  fixtures: {
    played: { home: 10, away: 10, total: 20 },
    wins: { home: 7, away: 5, total: 12 },
    draws: { home: 2, away: 3, total: 5 },
    loses: { home: 1, away: 2, total: 3 }
  },
  goals: {
    for: { home: { total: 25, average: '2.5' }, away: { total: 18, average: '1.8' }, total: { total: 43, average: '2.15' } },
    against: { home: { total: 10, average: '1.0' }, away: { total: 15, average: '1.5' }, total: { total: 25, average: '1.25' } }
  },
  ...overrides
});

const createMockHeadToHead = (overrides?: Partial<HeadToHead>): HeadToHead => ({
  fixtures: [],
  summary: {
    team1Wins: 3,
    team2Wins: 1,
    draws: 1,
    totalMatches: 5
  },
  ...overrides
});

const createMockStanding = (rank: number, teamName: string, points: number): Standing => ({
  rank,
  team: { id: rank, name: teamName, logo: '' },
  points,
  goalsDiff: 10,
  form: 'WWDLW',
  all: { played: 20, win: 12, draw: 5, lose: 3, goals: { for: 43, against: 25 } },
  home: { played: 10, win: 7, draw: 2, lose: 1, goals: { for: 25, against: 10 } },
  away: { played: 10, win: 5, draw: 3, lose: 2, goals: { for: 18, against: 15 } }
});

describe('Prediction Engine', () => {
  describe('buildFeatures', () => {
    it('should calculate form scores correctly', () => {
      const input: FeatureInput = {
        team1Stats: createMockTeamStats({ form: 'WWWWW' }),
        team2Stats: createMockTeamStats({ form: 'LLLLL' }),
        h2h: createMockHeadToHead(),
        standings: [],
        fixtures: []
      };

      const features = buildFeatures(input);

      expect(features.team1FormScore).toBe(100);
      expect(features.team2FormScore).toBe(0);
    });

    it('should handle missing data gracefully', () => {
      const input: FeatureInput = {
        team1Stats: null,
        team2Stats: null,
        h2h: createMockHeadToHead({ summary: { team1Wins: 0, team2Wins: 0, draws: 0, totalMatches: 0 } }),
        standings: [],
        fixtures: []
      };

      const features = buildFeatures(input);

      expect(features.dataCompleteness).toBeLessThan(50);
      expect(features.team1FormScore).toBe(50); // Neutral default
    });

    it('should calculate standings positions', () => {
      const input: FeatureInput = {
        team1Stats: createMockTeamStats({ team: { id: 1, name: 'Team A' } }),
        team2Stats: createMockTeamStats({ team: { id: 2, name: 'Team B' } }),
        h2h: createMockHeadToHead(),
        standings: [
          createMockStanding(1, 'Team A', 50),
          createMockStanding(5, 'Team B', 35)
        ],
        fixtures: []
      };

      const features = buildFeatures(input);

      expect(features.team1LeaguePosition).toBe(1);
      expect(features.team2LeaguePosition).toBe(5);
      expect(features.pointsDifference).toBe(15);
    });

    it('should calculate H2H correctly', () => {
      const input: FeatureInput = {
        team1Stats: createMockTeamStats(),
        team2Stats: createMockTeamStats(),
        h2h: createMockHeadToHead({
          summary: { team1Wins: 4, team2Wins: 1, draws: 0, totalMatches: 5 }
        }),
        standings: [],
        fixtures: []
      };

      const features = buildFeatures(input);

      expect(features.h2hTeam1Wins).toBe(4);
      expect(features.h2hTeam2Wins).toBe(1);
      expect(features.h2hTotal).toBe(5);
    });
  });

  describe('generatePredictionScore', () => {
    it('should favor team with better form', () => {
      const features: MatchFeatures = {
        team1FormScore: 100,
        team2FormScore: 40,
        team1HomeStrength: 60,
        team2AwayStrength: 50,
        team1GoalsFor: 200,
        team1GoalsAgainst: 100,
        team2GoalsFor: 120,
        team2GoalsAgainst: 150,
        team1LeaguePosition: 2,
        team2LeaguePosition: 8,
        pointsDifference: 15,
        h2hTeam1Wins: 3,
        h2hTeam2Wins: 2,
        h2hDraws: 1,
        h2hTotal: 6,
        team1Trend: 'stable',
        team2Trend: 'stable',
        dataCompleteness: 80
      };

      const score = generatePredictionScore(features);

      expect(score.team1WinProbability).toBeGreaterThan(score.team2WinProbability);
      expect(score.keyFactors.length).toBeGreaterThan(0);
    });

    it('should reduce confidence with low data completeness', () => {
      const features: MatchFeatures = {
        team1FormScore: 70,
        team2FormScore: 60,
        team1HomeStrength: 60,
        team2AwayStrength: 50,
        team1GoalsFor: 150,
        team1GoalsAgainst: 120,
        team2GoalsFor: 140,
        team2GoalsAgainst: 130,
        team1LeaguePosition: 5,
        team2LeaguePosition: 6,
        pointsDifference: 3,
        h2hTeam1Wins: 0,
        h2hTeam2Wins: 0,
        h2hDraws: 0,
        h2hTotal: 0,
        team1Trend: 'stable',
        team2Trend: 'stable',
        dataCompleteness: 30
      };

      const score = generatePredictionScore(features);

      expect(score.confidence).toBeLessThan(60);
      expect(score.keyFactors).toContain('Limited historical data available');
    });

    it('should provide sensible probabilities that sum near 100', () => {
      const features: MatchFeatures = {
        team1FormScore: 60,
        team2FormScore: 60,
        team1HomeStrength: 55,
        team2AwayStrength: 50,
        team1GoalsFor: 150,
        team1GoalsAgainst: 130,
        team2GoalsFor: 145,
        team2GoalsAgainst: 140,
        team1LeaguePosition: 5,
        team2LeaguePosition: 5,
        pointsDifference: 0,
        h2hTeam1Wins: 2,
        h2hTeam2Wins: 2,
        h2hDraws: 1,
        h2hTotal: 5,
        team1Trend: 'stable',
        team2Trend: 'stable',
        dataCompleteness: 90
      };

      const score = generatePredictionScore(features);
      const totalProb = score.team1WinProbability + score.drawProbability + score.team2WinProbability;

      expect(totalProb).toBeGreaterThan(95);
      expect(totalProb).toBeLessThanOrEqual(100);
    });

    it('should handle strong home advantage', () => {
      const features: MatchFeatures = {
        team1FormScore: 50,
        team2FormScore: 50,
        team1HomeStrength: 90,
        team2AwayStrength: 30,
        team1GoalsFor: 150,
        team1GoalsAgainst: 120,
        team2GoalsFor: 150,
        team2GoalsAgainst: 120,
        team1LeaguePosition: 5,
        team2LeaguePosition: 5,
        pointsDifference: 0,
        h2hTeam1Wins: 2,
        h2hTeam2Wins: 2,
        h2hDraws: 1,
        h2hTotal: 5,
        team1Trend: 'stable',
        team2Trend: 'stable',
        dataCompleteness: 85
      };

      const score = generatePredictionScore(features);

      expect(score.keyFactors.some(f => f.includes('home'))).toBe(true);
      expect(score.team1WinProbability).toBeGreaterThan(score.team2WinProbability);
    });
  });
});
