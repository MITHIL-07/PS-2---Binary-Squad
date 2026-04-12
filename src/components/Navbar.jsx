import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',               label: '🏠 Home' },
  { to: '/chat',           label: '💬 AI Chat' },
  { to: '/site-detection', label: '📍 Site Detection' },
  { to: '/map',            label: '🗺 Map Explorer' },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      background: '#111827',
      borderBottom: '1px solid #1f2937',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1rem', textDecoration: 'none' }}>
        🌏 GeoSpatial AI
      </Link>

      <div style={{ display: 'flex', gap: '8px' }}>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              color:           pathname === to ? 'white' : '#9ca3af',
              background:      pathname === to ? '#2563eb' : 'transparent',
              padding:         '6px 12px',
              borderRadius:    '8px',
              textDecoration:  'none',
              fontSize:        '0.875rem',
              fontWeight:      pathname === to ? '600' : '400',
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}