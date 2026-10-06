'use client';

import { useState, useRef, useEffect } from 'react';
import { sendChatMessage, getLeagues, ChatResponse, League } from '@/lib/api';
import LeagueFilter from './LeagueFilter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  prediction?: ChatResponse;
  timestamp: Date;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickPrompts = [
    'Top 5 teams in Bundesliga this season',
    'Real Madrid vs Barcelona prediction',
    'Best bet for Liverpool vs Arsenal',
    'Current La Liga standings',
  ];

  useEffect(() => {
    loadLeagues();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadLeagues = async () => {
    try {
      const data = await getLeagues();
      setLeagues(data);
    } catch (err) {
      console.error('Failed to load leagues:', err);
    }
  };

  const handleSend = async () => {
    if (isLoading) return;
    if (!input.trim()) {
      setError('Write a question first, then press Send.');
      inputRef.current?.focus();
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const selectedLeagueData = selectedLeague 
        ? leagues.find(l => l.id.toString() === selectedLeague)
        : null;

      const response = await sendChatMessage({
        query: userMessage.content,
        league: selectedLeagueData?.name,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reasoning,
        prediction: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 70) return 'bg-emerald-500';
    if (confidence >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-900 p-5 text-white">
        <h2 className="text-xl font-semibold tracking-tight">Prediction Assistant</h2>
        <p className="mt-1 text-sm text-slate-200">Ask for predictions, standings, form, odds view, and league insights.</p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <LeagueFilter 
          leagues={leagues} 
          selectedLeague={selectedLeague}
          onSelectLeague={setSelectedLeague}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[500px] space-y-4 overflow-y-auto bg-slate-50/50 p-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="text-lg font-semibold text-slate-900">Start with one of these</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>• “What are the top 5 teams in La Liga right now?”</li>
              <li>• “Predict Bayern Munich vs Dortmund”</li>
              <li>• “Who has better form, Arsenal or Man City?”</li>
              <li>• “Give me safest betting angle for Inter vs Juventus”</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                message.role === 'user'
                  ? 'rounded-br-md bg-slate-900 text-white'
                  : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {message.role === 'assistant' && message.prediction && (
                <div className="mb-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      Prediction: {message.prediction.prediction}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs text-white ${getConfidenceColor(
                        message.prediction.confidence
                      )}`}
                    >
                      {message.prediction.confidence}% heuristic score · unvalidated
                    </span>
                  </div>
                  
                  {message.prediction.recommendedBet && (
                    <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="text-sm font-medium text-slate-700">
                        Recommended: {message.prediction.recommendedBet}
                      </span>
                    </div>
                  )}

                  {message.prediction.keyFactors.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-semibold text-slate-600">Key factors:</p>
                      <ul className="space-y-0.5 text-xs text-slate-600">
                        {message.prediction.keyFactors.map((factor, idx) => (
                          <li key={idx}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    Updated: {new Date(message.prediction.dataFreshness).toLocaleString()}
                  </p>
                </div>
              )}
              
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask anything football... (predictions, standings, form, top teams)"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => {
              void handleSend();
            }}
            disabled={isLoading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
