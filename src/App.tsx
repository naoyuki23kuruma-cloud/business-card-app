import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import AddCard from './pages/AddCard'
import CardDetail from './pages/CardDetail'
import Search from './pages/Search'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/add" element={<AddCard />} />
          <Route path="/cards/:id" element={<CardDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
