import { Link } from 'react-router-dom'
import { MessageSquare, MapPin, Map, ArrowRight, Globe, Zap, Database } from 'lucide-react'

const features = [
  {
    to:          '/chat',
    icon:        MessageSquare,
    title:       'AI Chat',
    description: 'Talk to GeoBot powered by LLaMA3. Ask it to find optimal sites, analyze regions, or explain geospatial concepts.',
    color:       'blue',
    tag:         'Powered by Groq',
  },
  {
    to:          '/site-detection',
    icon:        MapPin,
    title:       'Site Detection',
    description: 'Search any location, pick a use case like solar farm or hospital, and get AI-ranked candidate sites on a map.',
    color:       'green',
    tag:         'OSM + Scoring Engine',
  },
  {
    to:          '/map',
    icon:        Map,
    title:       'Map Explorer',
    description: 'Explore geospatial layers — roads, buildings, water, hospitals — rendered live on an interactive map.',
    color:       'purple',
    tag:         'OpenStreetMap',
  },
]

const stats = [
  { icon: Globe,    label: 'Free APIs',       value: '5+' },
  { icon: Zap,      label: 'LLM Powered',     value: 'LLaMA3' },
  { icon: Database, label: 'Use Cases',        value: '5' },
  { icon: MapPin,   label: 'OSM Layers',       value: '6+' },
]

const colorMap = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   btn: 'text-blue-400 hover:text-blue-300' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  btn: 'text-green-400 hover:text-green-300' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', btn: 'text-purple-400 hover:text-purple-300' },
}

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            TIC TAC TOE 2026 Hackathon
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 leading-tight">
            GeoSpatial
            <span className="text-blue-400"> AI </span>
            Assistant
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            Detect optimal sites, analyze geospatial data, and explore maps
            with the power of LLaMA3 + OpenStreetMap.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 text-sm"
            >
              <MessageSquare size={16} />
              Start Chatting
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/site-detection"
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 text-sm border border-gray-700"
            >
              <MapPin size={16} />
              Detect Sites
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <Icon size={20} className="text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            What can you do?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {features.map(({ to, icon: Icon, title, description, color, tag }) => {
              const c = colorMap[color]
              return (
                <Link
                  key={to}
                  to={to}
                  className={`group bg-gray-900 border ${c.border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200`}
                >
                  <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={22} className={c.icon} />
                  </div>
                  <span className="text-xs text-gray-500 mb-2 block">{tag}</span>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{description}</p>
                  <div className={`flex items-center gap-1 text-sm font-medium ${c.btn} transition-colors`}>
                    <span>Get started</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}