import ChatWindow from '@/components/ChatWindow'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Football Assistant</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Football Prediction Chatbot
          </h1>
          <p className="mt-2 text-sm text-slate-600 md:text-base">
            Data-backed insights for UCL, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Algerian Ligue 1 and more.
          </p>
        </header>

        <ChatWindow />
      </div>
    </main>
  )
}
