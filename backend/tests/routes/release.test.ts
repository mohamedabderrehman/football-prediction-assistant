import {describe,it,expect} from 'vitest';
import request from 'supertest';
import {app} from '../../src/server';
import {GrokClient} from '../../src/providers/grok/client';
describe('Synthetic release workflows',()=>{
  it('explains a fixture match without contacting providers',async()=>{
    const result=await request(app).post('/chat').send({query:'Analyse this match',team1:'Demo United',team2:'Sample City',league:'Premier League'});
    expect(result.status).toBe(200);
    expect(result.body.verification.usedApiFootball).toBe(false);
    expect(result.body.verification.usedGrok).toBe(false);
    expect(result.body.fixtureMode).toBe(true);
    expect(result.body.dataFreshness).toBe('2026-01-01T00:00:00.000Z');
    expect(result.body.verification.dataCompleteness).toBeGreaterThan(0);
  });
  it('returns synthetic standings with honest provider metadata',async()=>{
    const result=await request(app).post('/chat').send({query:'Premier League standings',league:'Premier League'});
    expect(result.status).toBe(200);
    expect(result.body.verification.usedApiFootball).toBe(false);
    expect(result.body.reasoning).toContain('Demo United');
  });
  it('applies the limiter to the actual mounted league route',async()=>{
    let status=200;
    for(let i=0;i<35;i++) status=(await request(app).get('/leagues')).status;
    expect(status).toBe(429);
    expect((await request(app).get('/health')).status).toBe(200);
  });
  it('marks the fixture explanation as provider-free',async()=>{
    const result=await new GrokClient().generateResponse('synthetic evidence');
    expect(result.usedProvider).toBe(false);
  });
});
