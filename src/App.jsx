import { BrowserRouter, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{color:'white',padding:'20px'}}>✅ App Works!</div>} />
      </Routes>
    </BrowserRouter>
  )
}
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<div style={{color:'white',padding:'20px'}}>✅ App Works!</div>} />
      </Routes>
    </BrowserRouter>
  )
}