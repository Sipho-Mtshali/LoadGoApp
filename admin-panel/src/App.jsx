import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [stats, setStats] = useState({
    total_trips: 0,
    active_drivers: 0,
    revenue: 0,
    pending_payments: 0
  })

  const [recentTrips, setRecentTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/stats')
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch recent trips
      const tripsResponse = await fetch('http://localhost:5000/api/trips/recent')
      const tripsData = await tripsResponse.json()
      setRecentTrips(tripsData)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>LoadGo Admin Dashboard</h1>
        </header>
        <div className="loading">Loading dashboard data...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>LoadGo Admin Dashboard</h1>
        <nav className="nav">
          <a href="#dashboard" className="nav-link active">Dashboard</a>
          <a href="#users" className="nav-link">Users</a>
          <a href="#drivers" className="nav-link">Drivers</a>
          <a href="#trips" className="nav-link">Trips</a>
          <a href="#payments" className="nav-link">Payments</a>
        </nav>
        <button onClick={refreshData} className="refresh-btn">
          Refresh Data
        </button>
      </header>
      
      <main className="app-main">
        {/* Dashboard Statistics */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <h3>Total Trips</h3>
            <p className="stat-number">{stats.total_trips.toLocaleString()}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">👤</div>
            <h3>Active Drivers</h3>
            <p className="stat-number">{stats.active_drivers.toLocaleString()}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <h3>Revenue</h3>
            <p className="stat-number">R{stats.revenue.toLocaleString()}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <h3>Pending Payments</h3>
            <p className="stat-number">R{stats.pending_payments.toLocaleString()}</p>
          </div>
        </div>

        {/* Recent Trips Section */}
        <div className="recent-section">
          <div className="section-header">
            <h2>Recent Trips</h2>
            <span className="trips-count">{recentTrips.length} trips</span>
          </div>
          
          <div className="trips-table">
            <div className="table-header">
              <span>Driver</span>
              <span>Pickup Location</span>
              <span>Status</span>
            </div>
            
            {recentTrips.map((trip) => (
              <div key={trip.id} className="table-row">
                <span className="driver-name">{trip.driver_name}</span>
                <span className="pickup-address">{trip.pickup_address}</span>
                <span className={`status status-${trip.status.toLowerCase()}`}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="status-section">
          <h2>System Status</h2>
          <div className="status-cards">
            <div className="status-card online">
              <span className="status-dot"></span>
              Backend API: Online
            </div>
            <div className="status-card online">
              <span className="status-dot"></span>
              Database: Connected
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
