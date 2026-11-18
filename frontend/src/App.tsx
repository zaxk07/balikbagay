import { Footer, Navbar } from './components/Shell'
import Home from './pages/Home'
import HowItWorks from './pages/HowItWorks'
import Inventory from './pages/Inventory'
import Report from './pages/Report'
import Scanner from './pages/Scanner'
import { useRoute } from './router'
import { ItemsProvider } from './store'

export default function App() {
  const route = useRoute()
  return (
    <ItemsProvider>
      <Navbar current={route.name} />
      <main className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        {route.name === 'home' && <Home />}
        {route.name === 'scanner' && <Scanner route={route} />}
        {route.name === 'inventory' && <Inventory route={route} />}
        {route.name === 'report' && <Report />}
        {route.name === 'how' && <HowItWorks />}
      </main>
      <Footer />
    </ItemsProvider>
  )
}
