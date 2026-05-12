import { NavLink, Outlet } from 'react-router-dom'
import { Home, Search, PlusCircle } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'ホーム', end: true },
  { to: '/search', icon: Search, label: '検索', end: false },
  { to: '/add', icon: PlusCircle, label: '登録', end: false },
]

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen md:flex-row bg-gray-50">
      {/* PC: 左サイドバー */}
      <nav className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 px-4 py-6 gap-1">
        <h1 className="text-lg font-bold text-primary-600 mb-6 px-2">📇 名刺管理</h1>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* メインコンテンツ */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0 min-h-screen">
        <Outlet />
      </main>

      {/* スマホ: 下部タブバー */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs font-medium px-4 py-1 rounded-lg ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Icon size={24} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
