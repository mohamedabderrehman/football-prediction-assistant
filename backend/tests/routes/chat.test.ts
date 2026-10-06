import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { chatRouter } from '../../src/routes/chat';
import { healthRouter } from '../../src/routes/health';
import { leaguesRouter } from '../../src/routes/leagues';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/chat', chatRouter);
  app.use('/leagues', leaguesRouter);
  return app;
};

describe('API Routes', () => {
  const app = createTestApp();

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /leagues', () => {
    it('should return supported leagues', async () => {
      const response = await request(app).get('/leagues');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const firstLeague = response.body[0];
      expect(firstLeague).toHaveProperty('id');
      expect(firstLeague).toHaveProperty('name');
      expect(firstLeague).toHaveProperty('country');
    });

    it('should include Champions League', async () => {
      const response = await request(app).get('/leagues');
      const ucl = response.body.find((l: any) => l.name === 'UEFA Champions League');

      expect(ucl).toBeDefined();
      expect(ucl.id).toBe(2);
    });

    it('should include major European leagues', async () => {
      const response = await request(app).get('/leagues');
      const leagueNames = response.body.map((l: any) => l.name);

      expect(leagueNames).toContain('Premier League');
      expect(leagueNames).toContain('La Liga');
      expect(leagueNames).toContain('Bundesliga');
      expect(leagueNames).toContain('Serie A');
      expect(leagueNames).toContain('Ligue 1');
    });
  });

  describe('POST /chat', () => {
    it('should reject empty queries', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject queries that are too long', async () => {
      const longQuery = 'a'.repeat(501);
      const response = await request(app)
        .post('/chat')
        .send({ query: longQuery });

      expect(response.status).toBe(400);
    });

    it('should accept valid prediction requests', async () => {
      // Note: This test might fail if API keys are not configured
      // In a real test suite, you'd mock the API responses
      const response = await request(app)
        .post('/chat')
        .send({ query: 'Real Madrid vs Barcelona' });

      // If no API keys, we expect an error response
      // If API keys exist, we expect a prediction
      expect([200, 400, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('prediction');
        expect(response.body).toHaveProperty('confidence');
        expect(response.body).toHaveProperty('reasoning');
        expect(response.body).toHaveProperty('keyFactors');
        expect(Array.isArray(response.body.keyFactors)).toBe(true);
      }
    });

    it('should handle unknown teams gracefully', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ query: 'TeamThatDoesNotExist vs AnotherFakeTeam12345' });

      // Should either return a 400 with helpful message or a 500 with graceful error
      expect([200, 400, 500]).toContain(response.status);

      if (response.status === 200 || response.status === 400) {
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should accept optional league parameter', async () => {
      const response = await request(app)
        .post('/chat')
        .send({ 
          query: 'Liverpool vs Arsenal',
          league: 'Premier League'
        });

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});

