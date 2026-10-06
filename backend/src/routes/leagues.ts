import { Router } from 'express';
import { logger } from '../utils/logger';
import { getSupportedLeagues } from '../providers/apiFootball/leagues';

const router = Router();

router.get('/', (req, res) => {
  logger.debug('Leagues endpoint hit');
  
  const leagues = getSupportedLeagues();
  
  res.json(leagues.map(league => ({
    id: league.id,
    name: league.name,
    country: league.country,
    type: league.type,
    season: league.season
  })));
});

export { router as leaguesRouter };
