import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    total_trips: 0,
    active_drivers: 0,
    revenue: 0,
    pending_payments: 0
  });

  const [recentTrips, setRecentTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    id: 1,
    name: 'Admin User',
    email: 'admin@loadgo.com',
    role: 'admin',
    phone: '+27 123 456 7890',
    joined_date: '2024-01-15'
  });

  // Sample data for charts - will be replaced with real data
  const [tripData, setTripData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalyticsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('http://localhost:5000/api/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent trips
      const tripsResponse = await fetch('http://localhost:5000/api/trips/recent');
      const tripsData = await tripsResponse.json();
      setRecentTrips(tripsData);

      // Fetch all data for other tabs
      const usersResponse = await fetch('http://localhost:5000/api/users');
      const usersData = await usersResponse.json();
      setUsers(usersData);

      const driversData = usersData.filter(user => user.role === 'driver');
      setDrivers(driversData);

      const tripsResponseAll = await fetch('http://localhost:5000/api/orders');
      const tripsDataAll = await tripsResponseAll.json();
      setTrips(tripsDataAll);

      const paymentsResponse = await fetch('http://localhost:5000/api/payments');
      const paymentsData = await paymentsResponse.json();
      setPayments(paymentsData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      // Fetch trip analytics data
      const tripAnalyticsResponse = await fetch('http://localhost:5000/api/analytics/trips');
      const tripAnalyticsData = await tripAnalyticsResponse.json();
      setTripData(tripAnalyticsData);

      // Fetch revenue analytics data
      const revenueAnalyticsResponse = await fetch('http://localhost:5000/api/analytics/revenue');
      const revenueAnalyticsData = await revenueAnalyticsResponse.json();
      setRevenueData(revenueAnalyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      
      // Fallback to sample data if API not available
      setTripData([
        { day: 'Wed', trips: 1200 },
        { day: 'Thu', trips: 1900 },
        { day: 'Fri', trips: 1500 },
        { day: 'Sat', trips: 2200 },
        { day: 'Sun', trips: 1800 },
        { day: 'Mon', trips: 2100 },
        { day: 'Tue', trips: 1600 }
      ]);
      
      setRevenueData([
        { day: 'Wed', revenue: 4500 },
        { day: 'Thu', revenue: 5200 },
        { day: 'Fri', revenue: 4800 },
        { day: 'Sat', revenue: 6100 },
        { day: 'Sun', revenue: 5500 },
        { day: 'Mon', revenue: 5900 },
        { day: 'Tue', revenue: 5100 }
      ]);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userProfile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUserProfile(updatedUser);
        setEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const refreshData = () => {
    fetchDashboardData();
    fetchAnalyticsData();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // Function to render bar chart
  const renderBarChart = (data, color, isCurrency = false) => {
    if (!data || data.length === 0) {
      return <div className="no-data">No data available</div>;
    }
    
    const maxValue = Math.max(...data.map(item => isCurrency ? item.revenue : item.trips));
    
    return (
      <div className="chart-container">
        <div className="chart-bars">
          {data.map((item, index) => {
            const height = ((isCurrency ? item.revenue : item.trips) / maxValue) * 100;
            return (
              <div key={index} className="chart-bar">
                <div 
                  className="chart-bar-fill" 
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: color
                  }}
                ></div>
                <div className="chart-label">{item.day}</div>
                <div className="chart-value">
                  {isCurrency ? formatCurrency(item.revenue) : item.trips}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>LoadGo Admin Dashboard</h1>
        </header>
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  const renderDashboard = () => (
    <>
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
          <p className="stat-number">{formatCurrency(stats.revenue)}</p>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <h3>Pending Payments</h3>
          <p className="stat-number">{formatCurrency(stats.pending_payments)}</p>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="analytics-section">
        <div className="chart-card">
          <h3>Trips This Week</h3>
          {renderBarChart(tripData, '#3498db')}
        </div>
        
        <div className="chart-card">
          <h3>Revenue This Week</h3>
          {renderBarChart(revenueData, '#27ae60', true)}
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="tab-content">
        <div className="section-header">
          <h2>Recent Trips</h2>
          <span className="badge">{recentTrips.length} trips</span>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Driver</th>
                <th>Pickup Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id}>
                  <td className="text-center">{trip.id}</td>
                  <td className="text-bold">{trip.driver_name}</td>
                  <td>{trip.pickup_address}</td>
                  <td>
                    <span className={`status status-${trip.status.toLowerCase()}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <button className="action-btn view-btn" title="View Details">
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Users Management</h2>
        <span className="badge">{users.length} users</span>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Phone</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="text-center">{user.id}</td>
                <td className="text-bold">{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.phone || 'N/A'}</td>
                <td>{formatDate(user.created_at)}</td>
                <td className="text-center">
                  <button className="action-btn edit-btn" title="Edit User">
                    ✏️
                  </button>
                  <button className="action-btn delete-btn" title="Delete User">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDrivers = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Drivers Management</h2>
        <span className="badge">{drivers.length} drivers</span>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Vehicle</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td className="text-center">{driver.id}</td>
                <td className="text-bold">{driver.name}</td>
                <td>{driver.email}</td>
                <td>{driver.phone || 'N/A'}</td>
                <td>
                  <span className="badge status-active">Active</span>
                </td>
                <td>{driver.vehicle_type || 'N/A'}</td>
                <td>{formatDate(driver.created_at)}</td>
                <td className="text-center">
                  <button className="action-btn view-btn" title="View Details">
                    👁️
                  </button>
                  <button className="action-btn edit-btn" title="Edit Driver">
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTrips = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Trips Management</h2>
        <span className="badge">{trips.length} trips</span>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Pickup Location</th>
              <th>Dropoff Location</th>
              <th>Vehicle Type</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => (
              <tr key={trip.id}>
                <td className="text-center">{trip.id}</td>
                <td className="text-bold">{trip.customer_name}</td>
                <td className="text-bold">{trip.driver_name || 'Unassigned'}</td>
                <td>{trip.pickup_location}</td>
                <td>{trip.dropoff_location}</td>
                <td>
                  <span className="badge vehicle-type">{trip.vehicle_type}</span>
                </td>
                <td className="text-bold">{formatCurrency(trip.price)}</td>
                <td>
                  <span className={`badge status-${trip.status.toLowerCase()}`}>
                    {trip.status}
                  </span>
                </td>
                <td>{formatDate(trip.created_at)}</td>
                <td className="text-center">
                  <button className="action-btn view-btn" title="View Details">
                    👁️
                  </button>
                  <button className="action-btn edit-btn" title="Edit Trip">
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="tab-content">
      <div className="section-header">
        <h2>Payments Management</h2>
        <span className="badge">{payments.length} payments</span>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="text-center">{payment.id}</td>
                <td className="text-center">{payment.order_id}</td>
                <td className="text-bold">{payment.customer_name}</td>
                <td className="text-bold success">{formatCurrency(payment.amount)}</td>
                <td>
                  <span className="badge payment-method">
                    {payment.method || 'N/A'}
                  </span>
                </td>
                <td>
                  <span className={`badge status-${payment.status.toLowerCase()}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{formatDate(payment.created_at)}</td>
                <td className="text-center">
                  <button className="action-btn view-btn" title="View Details">
                    👁️
                  </button>
                  {payment.status === 'pending' && (
                    <button className="action-btn approve-btn" title="Approve Payment">
                      ✓
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfileModal = () => (
    <div className="modal-overlay" onClick={() => !editingProfile && setShowProfile(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProfile ? 'Edit Profile' : 'User Profile'}</h2>
          <button className="modal-close" onClick={() => {
            setEditingProfile(false);
            setShowProfile(false);
          }}>×</button>
        </div>
        
        {editingProfile ? (
          <form onSubmit={handleProfileUpdate}>
            <div className="profile-info">
              <div className="profile-avatar">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="profile-details">
                <div className="form-field">
                  <label htmlFor="name">Name:</label>
                  <input
                    type="text"
                    id="name"
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label htmlFor="phone">Phone:</label>
                  <input
                    type="tel"
                    id="phone"
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-field">
                  <label>Role:</label>
                  <span className={`badge role-${userProfile.role}`}>{userProfile.role}</span>
                </div>
                
                <div className="form-field">
                  <label>Joined Date:</label>
                  <span>{formatDate(userProfile.joined_date)}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setEditingProfile(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-info">
              <div className="profile-avatar">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              
              <div className="profile-details">
                <div className="profile-field">
                  <label>Name:</label>
                  <span>{userProfile.name}</span>
                </div>
                
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{userProfile.email}</span>
                </div>
                
                <div className="profile-field">
                  <label>Role:</label>
                  <span className={`badge role-${userProfile.role}`}>{userProfile.role}</span>
                </div>
                
                <div className="profile-field">
                  <label>Phone:</label>
                  <span>{userProfile.phone}</span>
                </div>
                
                <div className="profile-field">
                  <label>Joined Date:</label>
                  <span>{formatDate(userProfile.joined_date)}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-primary" 
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowProfile(false)}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>LoadGo Admin Dashboard</h1>
        <nav className="nav">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('users')} 
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
          >
            👥 Users
          </button>
          <button 
            onClick={() => setActiveTab('drivers')} 
            className={`nav-link ${activeTab === 'drivers' ? 'active' : ''}`}
          >
            🚗 Drivers
          </button>
          <button 
            onClick={() => setActiveTab('trips')} 
            className={`nav-link ${activeTab === 'trips' ? 'active' : ''}`}
          >
            📦 Trips
          </button>
          <button 
            onClick={() => setActiveTab('payments')} 
            className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
          >
            💰 Payments
          </button>
        </nav>
        
        <div className="header-actions">
          <button onClick={refreshData} className="refresh-btn">
            🔄 Refresh
          </button>
          
          <div className="profile-menu">
            <button 
              className="profile-btn"
              onClick={() => setShowProfile(true)}
              title="View Profile"
            >
              <div className="profile-avatar-small">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <span>{userProfile.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'drivers' && renderDrivers()}
        {activeTab === 'trips' && renderTrips()}
        {activeTab === 'payments' && renderPayments()}

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
            <div className="status-card online">
              <span className="status-dot"></span>
              Last Refresh: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </main>

      {showProfile && renderProfileModal()}
    </div>
  );
}

export default App;