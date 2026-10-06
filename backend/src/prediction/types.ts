import { TeamStats, Standing, Fixture, HeadToHead } from '../providers/apiFootball/types';

export interface MatchFeatures {
  // Form features
  team1FormScore: number;  // 0-100 based on last 5 matches
  team2FormScore: number;
  
  // Home/Away performance
  team1HomeStrength: number;  // 0-100
  team2AwayStrength: number;  // 0-100
  
  // Goal statistics
  team1GoalsFor: number;
  team1GoalsAgainst: number;
  team2GoalsFor: number;
  team2GoalsAgainst: number;
  
  // Standings position
  team1LeaguePosition: number;
  team2LeaguePosition: number;
  pointsDifference: number;
  
  // Head-to-head
  h2hTeam1Wins: number;
  h2hTeam2Wins: number;
  h2hDraws: number;
  h2hTotal: number;
  
  // Recent performance trends
  team1Trend: 'improving' | 'stable' | 'declining';
  team2Trend: 'improving' | 'stable' | 'declining';
  
  // Data quality
  dataCompleteness: number;  // 0-100 percentage of data available
}

export interface PredictionScore {
  team1WinProbability: number;  // 0-100
  drawProbability: number;  // 0-100
  team2WinProbability: number;  // 0-100
  confidence: number;  // 0-100 overall confidence
  prediction: 'TEAM1_WIN' | 'DRAW' | 'TEAM2_WIN';
  keyFactors: string[];
  recommendedBet: string;
}

export interface FeatureInput {
  team1Stats: TeamStats | null;
  team2Stats: TeamStats | null;
  h2h: HeadToHead;
  standings: Standing[];
  fixtures: Fixture[];
}
