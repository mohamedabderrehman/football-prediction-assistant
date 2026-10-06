/** Generated demonstration data. Not live or historical football observations. */
export const FIXTURE_TIMESTAMP = '2026-01-01T00:00:00.000Z';
const teams = [{id: 900001, name: 'Demo United'}, {id: 900002, name: 'Sample City'}];
const stats = (team: typeof teams[number]) => ({team, form: 'WWDLW',
  fixtures: {played:{home:5,away:5,total:10},wins:{home:3,away:2,total:5},draws:{home:1,away:2,total:3},loses:{home:1,away:1,total:2}},
  goals: {for:{home:{total:10,average:'2'},away:{total:8,average:'1.6'},total:{total:18,average:'1.8'}},against:{home:{total:5,average:'1'},away:{total:6,average:'1.2'},total:{total:11,average:'1.1'}}}
});
export function fixtureResponse(endpoint: string, params: Record<string,string>): unknown {
  if (endpoint === '/teams') return teams.filter(t => t.name.toLowerCase().includes((params.search || '').toLowerCase())).map(team=>({team}));
  if (endpoint === '/leagues') return [{league:{id:39,season:2025,type:'League'}}];
  if (endpoint === '/teams/statistics') return stats(teams.find(t=>String(t.id)===params.team) || teams[0]);
  if (endpoint === '/standings') return [{league:{standings:[teams.map((team,i)=>({rank:i+1,team,points:20-i*3,goalsDiff:7-i,form:'WWDLW',all:{played:10,win:5,draw:3,lose:2,goals:{for:18,against:11}},home:{played:5,win:3,draw:1,lose:1,goals:{for:10,against:5}},away:{played:5,win:2,draw:2,lose:1,goals:{for:8,against:6}}}))]}}];
  if (endpoint === '/fixtures' || endpoint === '/fixtures/headtohead') return [];
  if (endpoint === '/injuries') return [];
  throw new Error(`No synthetic fixture defined for ${endpoint}`);
}
