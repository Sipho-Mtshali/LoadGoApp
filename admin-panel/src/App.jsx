import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeDrivers: 0,
    revenue: 0,
    pendingPayments: 0
  })

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
      </header>
      
      <main className="app-main">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Trips</h3>
            <p className="stat-number">{stats.totalTrips}</p>
          </div>
          <div className="stat-card">
            <h3>Active Drivers</h3>
            <p className="stat-number">{stats.activeDrivers}</p>
          </div>
          <div className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-number">${stats.revenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Payments</h3>
            <p className="stat-number">${stats.pendingPayments.toFixed(2)}</p>
          </div>
        </div>

        <div className="recent-section">
          <h2>Recent Trips</h2>
          <div className="trips-table">
            <div className="table-header">
              <span>Driver</span>
              <span>Pickup</span>
              <span>Status</span>
            </div>
            <div className="table-row">
              <span>No trips yet</span>
              <span>-</span>
              <span>-</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App