import { Router } from 'express';
import { env } from '../config/env';
import { FIXTURE_TIMESTAMP } from '../providers/apiFootball/fixtures';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { logger } from '../utils/logger';
import { ApiFootballClient } from '../providers/apiFootball/client';
import { GrokClient } from '../providers/grok/client';
import { buildFeatures, generatePredictionScore } from '../prediction/featureBuilder';
import { composePrompt } from '../prompts/composePrompt';

const router = Router();

const chatSchema = z.object({
  query: z.string().min(1).max(500),
  league: z.string().optional(),
  team1: z.string().optional(),
  team2: z.string().optional(),
});

const apiFootball = new ApiFootballClient();
const grok = new GrokClient();

const isLeagueTableQuery = (query: string): boolean => {
  const q = query.toLowerCase();
  return (
    q.includes('best') ||
    q.includes('top') ||
    q.includes('table') ||
    q.includes('standings') ||
    q.includes('rank') ||
    q.includes('clubs')
  );
};

const extractSeasonFromQuery = (query: string): number | undefined => {
  const rangeMatch = query.match(/(20\d{2})\s*[\/-]\s*(20\d{2})/);
  if (rangeMatch) {
    return Number(rangeMatch[1]);
  }
  const seasonMatch = query.match(/season\s*(20\d{2})/i);
  if (seasonMatch) {
    return Number(seasonMatch[1]);
  }
  return undefined;
};

router.post('/', validate(chatSchema), async (req, res) => {
  const { query, league, team1, team2 } = req.body;
  const season = extractSeasonFromQuery(query);
  
  logger.info('Chat request received', { query, league, team1, team2 });
  
  try {
    // Handle league-table style questions without forcing a team-vs-team query.
    if (isLeagueTableQuery(query)) {
      let standings = [];
      try {
        standings = await apiFootball.getStandings(league, season);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Free plans do not have access to this season')) {
          const fallbackSeason = 2024;
          const fallbackStandings = await apiFootball.getStandings(league, fallbackSeason);
          if (fallbackStandings.length > 0) {
            const topFiveFallback = fallbackStandings
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .slice(0, 5);
            const rankingFallback = topFiveFallback
              .map((s, idx) => `${idx + 1}. ${s.team.name} (${s.points} pts)`)
              .join('\n');
            return res.status(200).json({
              prediction: 'LEAGUE_STANDINGS_FALLBACK',
              confidence: 90,
              reasoning: `Your current API-Football plan cannot access ${season}/${season! + 1} standings. Here are the latest available standings for ${league || 'this league'} (season ${fallbackSeason}/${fallbackSeason + 1}):\n${rankingFallback}`,
              keyFactors: ['Live standings from API-Football', 'Season access limited by current API plan'],
              dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE,
              verification: {
                usedApiFootball: !env.FIXTURE_MODE,
                usedGrok: false,
                mode: 'standings_lookup_fallback',
                seasonRequested: season,
                seasonUsed: fallbackSeason
              }
            });
          }
          return res.status(403).json({
            error: `Your API-Football plan cannot access season ${season}/${season! + 1}.`,
            prediction: 'LEAGUE_STANDINGS_UNAVAILABLE',
            confidence: 0,
            reasoning: 'No accessible standings were found for your plan.',
            keyFactors: [],
            dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE,
            verification: {
              usedApiFootball: !env.FIXTURE_MODE,
              usedGrok: false,
              mode: 'standings_lookup',
              seasonRequested: season
            }
          });
        }
        throw error;
      }
      if (standings.length > 0) {
        const topFive = standings
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 5);

        const rankingText = topFive
          .map((s, idx) => `${idx + 1}. ${s.team.name} (${s.points} pts)`)
          .join('\n');

        return res.json({
          prediction: 'LEAGUE_STANDINGS',
          confidence: 95,
          reasoning: `Top 5 clubs in ${league || 'the selected league'}${season ? ` for season ${season}/${season + 1}` : ' this season'}:\n${rankingText}`,
          keyFactors: ['Live standings from API-Football'],
          dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE,
          recommendedBet: undefined,
          verification: {
            usedApiFootball: !env.FIXTURE_MODE,
            usedGrok: false,
            mode: 'standings_lookup',
            seasonUsed: season || 'auto'
          }
        });
      }
      return res.status(404).json({
        error: season
          ? `No standings found for ${league || 'this league'} in season ${season}/${season + 1}.`
          : 'No standings found for the selected league.',
        prediction: 'LEAGUE_STANDINGS_UNAVAILABLE',
        confidence: 0,
        reasoning: 'I could not find standings data for that exact season/league combination.',
        keyFactors: [],
        dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE,
        verification: {
          usedApiFootball: !env.FIXTURE_MODE,
          usedGrok: false,
          mode: 'standings_lookup',
          seasonUsed: season || 'auto'
        }
      });
    }

    // Step 1: Extract teams from query if not provided explicitly
    const extractedTeams = team1 && team2 
      ? { team1, team2 }
      : await apiFootball.extractTeamsFromQuery(query, league);
    
    if (!extractedTeams.team1 || !extractedTeams.team2) {
      return res.status(400).json({
        error: 'Could not identify both teams from your query. Please specify team names clearly.',
        prediction: 'Unknown',
        confidence: 0,
        reasoning: 'Insufficient information to make a prediction.',
        keyFactors: [],
        dataFreshness: 'N/A'
      });
    }

    logger.info('Teams identified', extractedTeams);

    // Step 2: Fetch comprehensive data from API-Football
    const [
      fixtures,
      standings,
      team1Stats,
      team2Stats,
      h2h
    ] = await Promise.all([
      apiFootball.getUpcomingFixtures(extractedTeams.team1, extractedTeams.team2),
      apiFootball.getStandings(league, season),
      apiFootball.getTeamStats(extractedTeams.team1),
      apiFootball.getTeamStats(extractedTeams.team2),
      apiFootball.getHeadToHead(extractedTeams.team1, extractedTeams.team2)
    ]);

    if (!team1Stats && !team2Stats) {
      return res.status(400).json({error: 'No team statistics available for the requested teams', prediction: 'Unknown', confidence: 0, reasoning: 'Insufficient source data', keyFactors: [], dataFreshness: 'N/A'});
    }

    // Step 3: Build features and calculate prediction score
    const features = buildFeatures({
      team1Stats,
      team2Stats,
      h2h,
      standings,
      fixtures
    });

    const predictionScore = generatePredictionScore(features);

    // Step 4: Compose prompt with structured data
    const prompt = composePrompt({
      team1: extractedTeams.team1,
      team2: extractedTeams.team2,
      features,
      predictionScore,
      query
    });

    // Step 5: Get AI response from Grok
    const aiResponse = await grok.generateResponse(prompt);

    // Step 6: Format and return response
    const response = {
      prediction: aiResponse.prediction,
      confidence: predictionScore.confidence,
      reasoning: aiResponse.reasoning,
      keyFactors: predictionScore.keyFactors,
      dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE,
      recommendedBet: aiResponse.recommendedBet,
      verification: {
        usedApiFootball: !env.FIXTURE_MODE,
        usedGrok: aiResponse.usedProvider === true,
        teams: {
          team1: extractedTeams.team1,
          team2: extractedTeams.team2
        },
        dataCompleteness: features.dataCompleteness,
        sampleSignals: {
          team1FormScore: features.team1FormScore,
          team2FormScore: features.team2FormScore,
          h2hMatches: features.h2hTotal,
          standingsFound: standings.length > 0
        }
      }
    };

    logger.info('Prediction generated', { 
      teams: `${extractedTeams.team1} vs ${extractedTeams.team2}`,
      prediction: response.prediction,
      confidence: response.confidence
    });

    res.json(response);

  } catch (error) {
    logger.error('Error processing chat request', error);
    
    // Graceful degradation
    res.status(500).json({
      error: 'Failed to generate prediction',
      prediction: 'Unable to predict',
      confidence: 0,
      reasoning: 'An error occurred while processing your request. Please try again.',
      keyFactors: [],
      dataFreshness: env.FIXTURE_MODE ? FIXTURE_TIMESTAMP : 'Provider observation timestamp unavailable; responses may be cached',
      generatedAt: new Date().toISOString(),
      fixtureMode: env.FIXTURE_MODE
    });
  }
});

export { router as chatRouter };

