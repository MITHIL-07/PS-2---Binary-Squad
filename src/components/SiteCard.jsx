import { MapPin, TrendingUp } from 'lucide-react'

function ScoreBar({ label, value }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-32 truncate">{label.replace(/_/g, ' ')}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-300 w-8 text-right">{pct}%</span>
    </div>
  )
}

function scoreColor(score) {
  if (score >= 0.7) return 'text-green-400'
  if (score >= 0.4) return 'text-yellow-400'
  return 'text-red-400'
}

function scoreBg(score) {
  if (score >= 0.7) return 'bg-green-400/10 border-green-400/20'
  if (score >= 0.4) return 'bg-yellow-400/10 border-yellow-400/20'
  return 'bg-red-400/10 border-red-400/20'
}

export default function SiteCard({ site, rank, onFocus }) {
  const pct = Math.round(site.score * 100)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {rank}
          </span>
          <div>
            <p className="text-xs text-gray-400 font-mono">{site.site_id}</p>
            <p className="text-xs text-gray-500">
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Score badge */}
        <div className={`border rounded-lg px-2 py-1 text-center ${scoreBg(site.score)}`}>
          <p className={`text-lg font-bold ${scoreColor(site.score)}`}>{pct}%</p>
          <p className="text-xs text-gray-500">score</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded-full h-2 mb-1">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              site.score >= 0.7 ? 'bg-green-400' :
              site.score >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 mb-3">
        {Object.entries(site.breakdown).slice(0, 4).map(([key, val]) => (
          <ScoreBar key={key} label={key} value={val} />
        ))}
      </div>

      {/* Focus button */}
      <button
        onClick={() => onFocus && onFocus(site)}
        className="w-full flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 hover:border-blue-400/40 rounded-lg py-1.5 transition-colors"
      >
        <MapPin size={12} />
        Focus on Map
      </button>
    </div>
  )
}