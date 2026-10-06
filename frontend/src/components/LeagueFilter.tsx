'use client';

import { League } from '@/lib/api';

interface LeagueFilterProps {
  leagues: League[];
  selectedLeague: string | null;
  onSelectLeague: (leagueId: string | null) => void;
}

export default function LeagueFilter({ leagues, selectedLeague, onSelectLeague }: LeagueFilterProps) {
  return (
    <div className="mb-1 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelectLeague(null)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          selectedLeague === null
            ? 'bg-slate-900 text-white'
            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
        }`}
      >
        All Leagues
      </button>
      
      {leagues.map((league) => (
        <button
          type="button"
          key={league.id}
          onClick={() => onSelectLeague(league.id.toString())}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            selectedLeague === league.id.toString()
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          {league.name}
        </button>
      ))}
    </div>
  );
}
