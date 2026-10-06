import { MatchFeatures, PredictionScore, FeatureInput } from './types';
import { logger } from '../utils/logger';

/**
 * Calculate form score from form string (e.g., "WWDLW")
 * W = 3 points, D = 1 point, L = 0 points
 * Returns score 0-100
 */
function calculateFormScore(form: string): number {
  if (!form || form.length === 0) return 50; // Neutral if no data
  
  const matches = form.slice(-5); // Last 5 matches
  let points = 0;
  let maxPoints = matches.length * 3;
  
  for (const char of matches) {
    switch (char.toUpperCase()) {
      case 'W': points += 3; break;
      case 'D': points += 1; break;
      case 'L': points += 0; break;
    }
  }
  
  return (points / maxPoints) * 100;
}

/**
 * Calculate home/away strength score
 */
function calculateHomeAwayStrength(stats: any, isHome: boolean): number {
  if (!stats) return 50;
  
  const location = isHome ? stats.fixtures?.wins?.home : stats.fixtures?.wins?.away;
  const totalPlayed = isHome ? stats.fixtures?.played?.home : stats.fixtures?.played?.away;
  
  if (!location || !totalPlayed || totalPlayed === 0) return 50;
  
  const winRate = location / totalPlayed;
  return winRate * 100;
}

/**
 * Determine performance trend from form
 */
function calculateTrend(form: string): 'improving' | 'stable' | 'declining' {
  if (!form || form.length < 3) return 'stable';
  
  const recent = form.slice(-3);
  const older = form.slice(0, -3) || '';
  
  const recentScore = calculateFormScore(recent);
  const olderScore = older ? calculateFormScore(older) : recentScore;
  
  const diff = recentScore - olderScore;
  
  if (diff > 15) return 'improving';
  if (diff < -15) return 'declining';
  return 'stable';
}

export function buildFeatures(input: FeatureInput): MatchFeatures {
  const { team1Stats, team2Stats, h2h, standings } = input;
  
  // Calculate form scores
  const team1FormScore = calculateFormScore(team1Stats?.form || '');
  const team2FormScore = calculateFormScore(team2Stats?.form || '');
  
  // Calculate home/away strengths
  const team1HomeStrength = calculateHomeAwayStrength(team1Stats, true);
  const team2AwayStrength = calculateHomeAwayStrength(team2Stats, false);
  
  // Get goals stats
  const team1GoalsFor = parseFloat(team1Stats?.goals?.for?.total?.average || '0') * 100;
  const team1GoalsAgainst = parseFloat(team1Stats?.goals?.against?.total?.average || '0') * 100;
  const team2GoalsFor = parseFloat(team2Stats?.goals?.for?.total?.average || '0') * 100;
  const team2GoalsAgainst = parseFloat(team2Stats?.goals?.against?.total?.average || '0') * 100;
  
  // Get standings positions
  const team1Standing = standings.find(s => 
    s.team.name.toLowerCase().includes(team1Stats?.team?.name?.toLowerCase() || '')
  );
  const team2Standing = standings.find(s => 
    s.team.name.toLowerCase().includes(team2Stats?.team?.name?.toLowerCase() || '')
  );
  
  const team1LeaguePosition = team1Standing?.rank || 10;
  const team2LeaguePosition = team2Standing?.rank || 10;
  const pointsDifference = (team1Standing?.points || 0) - (team2Standing?.points || 0);
  
  // Calculate trends
  const team1Trend = calculateTrend(team1Stats?.form || '');
  const team2Trend = calculateTrend(team2Stats?.form || '');
  
  // Calculate data completeness
  let dataPoints = 0;
  let totalDataPoints = 7; // Total possible data categories
  
  if (team1Stats?.form) dataPoints++;
  if (team2Stats?.form) dataPoints++;
  if (team1Stats?.fixtures?.played?.total) dataPoints++;
  if (team2Stats?.fixtures?.played?.total) dataPoints++;
  if (h2h.summary.totalMatches > 0) dataPoints++;
  if (team1Standing) dataPoints++;
  if (team2Standing) dataPoints++;
  
  const dataCompleteness = (dataPoints / totalDataPoints) * 100;
  
  return {
    team1FormScore,
    team2FormScore,
    team1HomeStrength,
    team2AwayStrength,
    team1GoalsFor,
    team1GoalsAgainst,
    team2GoalsFor,
    team2GoalsAgainst,
    team1LeaguePosition,
    team2LeaguePosition,
    pointsDifference,
    h2hTeam1Wins: h2h.summary.team1Wins,
    h2hTeam2Wins: h2h.summary.team2Wins,
    h2hDraws: h2h.summary.draws,
    h2hTotal: h2h.summary.totalMatches,
    team1Trend,
    team2Trend,
    dataCompleteness
  };
}

export function generatePredictionScore(features: MatchFeatures): PredictionScore {
  const keyFactors: string[] = [];
  
  // Weight factors for probability calculation
  const weights = {
    form: 0.25,
    homeAdvantage: 0.20,
    goals: 0.15,
    standings: 0.20,
    h2h: 0.20
  };
  
  // Form comparison
  const formAdvantage = (features.team1FormScore - features.team2FormScore) / 2;
  if (Math.abs(formAdvantage) > 10) {
    keyFactors.push(
      formAdvantage > 0 
        ? `Team 1 has better recent form (${features.team1FormScore.toFixed(0)} vs ${features.team2FormScore.toFixed(0)})`
        : `Team 2 has better recent form (${features.team2FormScore.toFixed(0)} vs ${features.team1FormScore.toFixed(0)})`
    );
  }
  
  // Home advantage
  const homeAdvantage = (features.team1HomeStrength - 50 + (50 - features.team2AwayStrength)) / 2;
  if (features.team1HomeStrength > 60) {
    keyFactors.push(`Strong home record (${features.team1HomeStrength.toFixed(0)}% win rate)`);
  }
  
  // Goals difference
  const goalAdvantage = (
    (features.team1GoalsFor - features.team2GoalsFor) + 
    (features.team2GoalsAgainst - features.team1GoalsAgainst)
  ) / 2;
  
  // Standings advantage
  const standingsAdvantage = (features.team2LeaguePosition - features.team1LeaguePosition) * 3 + features.pointsDifference;
  if (features.team1LeaguePosition < features.team2LeaguePosition) {
    keyFactors.push(`Higher league position (${features.team1LeaguePosition} vs ${features.team2LeaguePosition})`);
  }
  
  // H2H advantage
  let h2hAdvantage = 0;
  if (features.h2hTotal > 0) {
    const team1WinRate = features.h2hTeam1Wins / features.h2hTotal;
    const team2WinRate = features.h2hTeam2Wins / features.h2hTotal;
    h2hAdvantage = (team1WinRate - team2WinRate) * 100;
    
    if (features.h2hTeam1Wins > features.h2hTeam2Wins + 1) {
      keyFactors.push(`Better head-to-head record (${features.h2hTeam1Wins}W-${features.h2hDraws}D-${features.h2hTeam2Wins}L)`);
    }
  }
  
  // Trends
  if (features.team1Trend === 'improving' && features.team2Trend !== 'improving') {
    keyFactors.push('Improving form trend');
  }
  
  // Calculate probabilities
  const totalAdvantage = 
    formAdvantage * weights.form +
    homeAdvantage * weights.homeAdvantage +
    goalAdvantage * weights.goals +
    standingsAdvantage * weights.standings +
    h2hAdvantage * weights.h2h;
  
  // Base probabilities (fair match = 33% each roughly, adjusted for draw)
  let team1Prob = 35 + totalAdvantage * 0.5;
  let drawProb = 30;
  let team2Prob = 35 - totalAdvantage * 0.5;
  
  // Normalize to ensure they sum to 100
  const total = team1Prob + drawProb + team2Prob;
  team1Prob = (team1Prob / total) * 100;
  drawProb = (drawProb / total) * 100;
  team2Prob = (team2Prob / total) * 100;
  
  // Determine prediction
  let prediction: 'TEAM1_WIN' | 'DRAW' | 'TEAM2_WIN';
  if (team1Prob > team2Prob && team1Prob > drawProb) {
    prediction = 'TEAM1_WIN';
  } else if (team2Prob > team1Prob && team2Prob > drawProb) {
    prediction = 'TEAM2_WIN';
  } else {
    prediction = 'DRAW';
  }
  
  // Calculate confidence based on data completeness and prediction strength
  const maxProb = Math.max(team1Prob, team2Prob, drawProb);
  const confidence = (maxProb * 0.7) + (features.dataCompleteness * 0.3);
  
  // Determine recommended bet
  let recommendedBet = '';
  if (confidence >= 65) {
    recommendedBet = prediction === 'DRAW' ? 'Draw (1X2)' : 
                     prediction === 'TEAM1_WIN' ? 'Home Win (1X2)' : 'Away Win (1X2)';
  } else if (Math.max(team1Prob, team2Prob) > 50) {
    recommendedBet = 'Double Chance (1X or X2)';
  } else if (team1Prob + team2Prob > 60) {
    recommendedBet = 'Both Teams to Score';
  } else {
    recommendedBet = 'Consider skipping - high uncertainty';
  }
  
  // Add data quality factor
  if (features.dataCompleteness < 50) {
    keyFactors.push('Limited historical data available');
  }
  
  // Limit key factors to top 4
  const topFactors = keyFactors.slice(0, 4);
  
  return {
    team1WinProbability: Math.round(team1Prob),
    drawProbability: Math.round(drawProb),
    team2WinProbability: Math.round(team2Prob),
    confidence: Math.round(Math.min(confidence, 95)), // Cap at 95%
    prediction,
    keyFactors: topFactors,
    recommendedBet
  };
}
