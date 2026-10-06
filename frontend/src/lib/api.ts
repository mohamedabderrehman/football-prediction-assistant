const API_BASE_URL = '/api';

export interface ChatRequest {
  query: string;
  league?: string;
  team1?: string;
  team2?: string;
}

export interface ChatResponse {
  prediction: string;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  dataFreshness: string;
  recommendedBet?: string;
}

export interface League {
  id: number;
  name: string;
  country: string;
  logo?: string;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get prediction');
  }

  return response.json();
}

export async function getLeagues(): Promise<League[]> {
  const response = await fetch(`${API_BASE_URL}/leagues`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch leagues');
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; timestamp: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}
