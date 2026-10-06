import { MatchFeatures, PredictionScore } from '../prediction/types';
import { SYSTEM_PROMPT } from './systemPrompt';

interface PromptInput {
  team1: string;
  team2: string;
  features: MatchFeatures;
  predictionScore: PredictionScore;
  query: string;
}

export function composePrompt(input: PromptInput): string {
  const { team1, team2, features, predictionScore, query } = input;

  // Build the data section
  const dataSection = buildDataSection(team1, team2, features, predictionScore);

  // Compose the full prompt
  return `${SYSTEM_PROMPT}

=== USER QUERY ===
"${query}"

=== MATCH DATA ===
${dataSection}

=== STATISTICAL PREDICTION ===
- Team 1 (${team1}) Win Probability: ${predictionScore.team1WinProbability}%
- Draw Probability: ${predictionScore.drawProbability}%
- Team 2 (${team2}) Win Probability: ${predictionScore.team2WinProbability}%
- Overall Confidence: ${predictionScore.confidence}%
- Recommended Bet Type: ${predictionScore.recommendedBet}

=== YOUR TASK ===
Provide a prediction analysis based ONLY on the data above. 
Format your response as the JSON structure specified in your directives.
Ensure all statistics you mention are from this exact dataset.

Think step by step:
1. Review the data quality indicator
2. Identify the strongest statistical factors
3. Formulate probabilistic reasoning
4. Construct the JSON response`;
}

function buildDataSection(
  team1: string,
  team2: string,
  features: MatchFeatures,
  predictionScore: PredictionScore
): string {
  const sections: string[] = [];

  // Data Quality
  sections.push(`DATA QUALITY: ${features.dataCompleteness}% of required data available`);
  if (features.dataCompleteness < 50) {
    sections.push('WARNING: Limited data available - prediction confidence reduced');
  }

  // Recent Form
  sections.push(`\nRECENT FORM (Last 5 matches):`);
  sections.push(`- ${team1}: ${features.team1FormScore.toFixed(1)}/100 (${features.team1Trend})`);
  sections.push(`- ${team2}: ${features.team2FormScore.toFixed(1)}/100 (${features.team2Trend})`);

  // Home/Away Strength
  sections.push(`\nHOME/AWAY PERFORMANCE:`);
  sections.push(`- ${team1} Home Strength: ${features.team1HomeStrength.toFixed(1)}/100`);
  sections.push(`- ${team2} Away Strength: ${features.team2AwayStrength.toFixed(1)}/100`);

  // Goals
  sections.push(`\nGOALS PER MATCH (Season Average):`);
  sections.push(`- ${team1}: Scored ${(features.team1GoalsFor / 100).toFixed(2)}, Conceded ${(features.team1GoalsAgainst / 100).toFixed(2)}`);
  sections.push(`- ${team2}: Scored ${(features.team2GoalsFor / 100).toFixed(2)}, Conceded ${(features.team2GoalsAgainst / 100).toFixed(2)}`);

  // Standings
  if (features.team1LeaguePosition > 0 || features.team2LeaguePosition > 0) {
    sections.push(`\nLEAGUE STANDINGS:`);
    sections.push(`- ${team1} Position: ${features.team1LeaguePosition}${getPositionSuffix(features.team1LeaguePosition)}`);
    sections.push(`- ${team2} Position: ${features.team2LeaguePosition}${getPositionSuffix(features.team2LeaguePosition)}`);
    sections.push(`- Points Difference: ${features.pointsDifference > 0 ? '+' : ''}${features.pointsDifference} in favor of ${features.pointsDifference > 0 ? team1 : team2}`);
  }

  // Head-to-Head
  if (features.h2hTotal > 0) {
    sections.push(`\nHEAD-TO-HEAD RECORD (Last ${features.h2hTotal} meetings):`);
    sections.push(`- ${team1} Wins: ${features.h2hTeam1Wins}`);
    sections.push(`- ${team2} Wins: ${features.h2hTeam2Wins}`);
    sections.push(`- Draws: ${features.h2hDraws}`);
    
    const h2hWinRate = features.h2hTeam1Wins / features.h2hTotal;
    if (h2hWinRate > 0.6) {
      sections.push(`- Edge: ${team1} has strong H2H advantage (${(h2hWinRate * 100).toFixed(0)}% win rate)`);
    } else if (h2hWinRate < 0.4) {
      sections.push(`- Edge: ${team2} has strong H2H advantage (${((1 - h2hWinRate) * 100).toFixed(0)}% win rate)`);
    } else {
      sections.push(`- Edge: Relatively even H2H record`);
    }
  } else {
    sections.push(`\nHEAD-TO-HEAD: No recent meetings recorded`);
  }

  // Key Factors
  if (predictionScore.keyFactors.length > 0) {
    sections.push(`\nKEY FACTORS IDENTIFIED:`);
    predictionScore.keyFactors.forEach((factor, idx) => {
      sections.push(`${idx + 1}. ${factor}`);
    });
  }

  return sections.join('\n');
}

function getPositionSuffix(position: number): string {
  if (position === 1) return 'st';
  if (position === 2) return 'nd';
  if (position === 3) return 'rd';
  return 'th';
}

export default composePrompt;
