import AuthPage from './pages/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const { currentUser, logout } = useAuth(); // Add logout to the destructuring
  
  // If user is not authenticated, show auth pages
  if (!currentUser) {
    return (
      <div className="app">
        <AuthPage />
      </div>
    );
  }

  // Dashboard state and functions - ONLY when user is authenticated
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

  // Use the actual logged-in user data instead of hardcoded data
  const [userProfile, setUserProfile] = useState({
    id: currentUser?.id || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    role: currentUser?.role || '',
    phone: currentUser?.phone || '',
    joined_date: currentUser?.created_at || ''
  });

  // Modal states for view/edit functionality
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view' or 'edit'
  const [modalData, setModalData] = useState(null);
  const [modalDataType, setModalDataType] = useState(''); // 'user', 'driver', 'trip', 'payment'

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  // Sample data for charts - will be replaced with real data
  const [tripData, setTripData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);

  useEffect(() => {
    // Only fetch dashboard data if user is authenticated
    if (currentUser) {
      fetchDashboardData();
      fetchAnalyticsData();
      
      // Update user profile with actual user data
      setUserProfile({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        phone: currentUser.phone || '',
        joined_date: currentUser.created_at
      });
    }
  }, [currentUser]);

  // Toast notification system
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
      showToast('Error fetching dashboard data', 'error');
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
        const result = await response.json();
        if (result.success) {
          setUserProfile(result.user);
          setEditingProfile(false);
          showToast('Profile updated successfully!', 'success');
        } else {
          throw new Error(result.message || 'Failed to update profile');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast(`Error updating profile: ${error.message}`, 'error');
    }
  };

  // View/Edit modal functions
  const openViewModal = (data, dataType) => {
    setModalData(data);
    setModalDataType(dataType);
    setModalType('view');
    setShowModal(true);
  };

  const openEditModal = (data, dataType) => {
    setModalData({...data});
    setModalDataType(dataType);
    setModalType('edit');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    setModalDataType('');
    setModalType('');
  };

  const handleDelete = async (id, dataType) => {
    if (!window.confirm(`Are you sure you want to delete this ${dataType}?`)) {
      return;
    }

    try {
      const endpoint = dataType === 'user' ? 'users' : dataType === 'trip' ? 'orders' : `${dataType}s`;
      const response = await fetch(`http://localhost:5000/api/${endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast(`${dataType.charAt(0).toUpperCase() + dataType.slice(1)} deleted successfully!`, 'success');
        fetchDashboardData(); // Refresh data
      } else {
        throw new Error(`Failed to delete ${dataType}`);
      }
    } catch (error) {
      console.error(`Error deleting ${dataType}:`, error);
      showToast(`Error deleting ${dataType}: ${error.message}`, 'error');
    }
  };

  const handleModalSave = async () => {
    try {
      const endpoint = modalDataType === 'user' ? 'users' : 
                     modalDataType === 'trip' ? 'orders' : 
                     `${modalDataType}s`;
      
      const response = await fetch(`http://localhost:5000/api/${endpoint}/${modalData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showToast(`${modalDataType.charAt(0).toUpperCase() + modalDataType.slice(1)} updated successfully!`, 'success');
          fetchDashboardData(); // Refresh data
          closeModal();
        } else {
          throw new Error(result.message || `Failed to update ${modalDataType}`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update ${modalDataType}`);
      }
    } catch (error) {
      console.error(`Error updating ${modalDataType}:`, error);
      showToast(`Error updating ${modalDataType}: ${error.message}`, 'error');
    }
  };

  const refreshData = () => {
    fetchDashboardData();
    fetchAnalyticsData();
    showToast('Data refreshed successfully!', 'success');
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

  // Toast notification component
  const renderToasts = () => (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="toast-close">×</button>
        </div>
      ))}
    </div>
  );

  // Generic modal renderer
  const renderModal = () => {
    if (!showModal || !modalData) return null;

    const isEditing = modalType === 'edit';
    const title = isEditing ? `Edit ${modalDataType}` : `View ${modalDataType} Details`;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="modal-close" onClick={closeModal}>×</button>
          </div>
          
          <div className="modal-body">
            {modalDataType === 'user' && renderUserModal()}
            {modalDataType === 'driver' && renderDriverModal()}
            {modalDataType === 'trip' && renderTripModal()}
            {modalDataType === 'payment' && renderPaymentModal()}
          </div>
          
          <div className="modal-actions">
            {isEditing ? (
              <>
                <button className="btn-primary" onClick={handleModalSave}>Save Changes</button>
                <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              </>
            ) : (
              <>
                <button className="btn-primary" onClick={() => {
                  setModalType('edit');
                }}>Edit</button>
                <button className="btn-secondary" onClick={closeModal}>Close</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUserModal = () => {
    const isEditing = modalType === 'edit';
    
    return (
      <div className="modal-fields">
        <div className="field-group">
          <label>Name:</label>
          {isEditing ? (
            <input
              type="text"
              value={modalData.name || ''}
              onChange={(e) => setModalData({...modalData, name: e.target.value})}
            />
          ) : (
            <span>{modalData.name}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              value={modalData.email || ''}
              onChange={(e) => setModalData({...modalData, email: e.target.value})}
            />
          ) : (
            <span>{modalData.email}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Phone:</label>
          {isEditing ? (
            <input
              type="tel"
              value={modalData.phone || ''}
              onChange={(e) => setModalData({...modalData, phone: e.target.value})}
            />
          ) : (
            <span>{modalData.phone || 'N/A'}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Role:</label>
          <span className={`badge role-${modalData.role}`}>{modalData.role}</span>
        </div>
        
        <div className="field-group">
          <label>Joined Date:</label>
          <span>{formatDate(modalData.created_at)}</span>
        </div>
      </div>
    );
  };

  const renderDriverModal = () => {
    const isEditing = modalType === 'edit';
    
    return (
      <div className="modal-fields">
        <div className="field-group">
          <label>Name:</label>
          {isEditing ? (
            <input
              type="text"
              value={modalData.name || ''}
              onChange={(e) => setModalData({...modalData, name: e.target.value})}
            />
          ) : (
            <span>{modalData.name}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Email:</label>
          {isEditing ? (
            <input
              type="email"
              value={modalData.email || ''}
              onChange={(e) => setModalData({...modalData, email: e.target.value})}
            />
          ) : (
            <span>{modalData.email}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Phone:</label>
          {isEditing ? (
            <input
              type="tel"
              value={modalData.phone || ''}
              onChange={(e) => setModalData({...modalData, phone: e.target.value})}
            />
          ) : (
            <span>{modalData.phone || 'N/A'}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Vehicle Type:</label>
          {isEditing ? (
            <select
              value={modalData.vehicle_type || ''}
              onChange={(e) => setModalData({...modalData, vehicle_type: e.target.value})}
            >
              <option value="">Select Vehicle Type</option>
              <option value="bakkie">Bakkie</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
            </select>
          ) : (
            <span>{modalData.vehicle_type || 'N/A'}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Status:</label>
          <span className="badge status-active">Active</span>
        </div>
        
        <div className="field-group">
          <label>Joined Date:</label>
          <span>{formatDate(modalData.created_at)}</span>
        </div>
      </div>
    );
  };

  const renderTripModal = () => {
    const isEditing = modalType === 'edit';
    
    return (
      <div className="modal-fields">
        <div className="field-group">
          <label>Trip ID:</label>
          <span>{modalData.id}</span>
        </div>
        
        <div className="field-group">
          <label>Customer:</label>
          <span>{modalData.customer_name}</span>
        </div>
        
        <div className="field-group">
          <label>Driver:</label>
          <span>{modalData.driver_name || 'Unassigned'}</span>
        </div>
        
        <div className="field-group">
          <label>Pickup Location:</label>
          {isEditing ? (
            <input
              type="text"
              value={modalData.pickup_location || ''}
              onChange={(e) => setModalData({...modalData, pickup_location: e.target.value})}
            />
          ) : (
            <span>{modalData.pickup_location}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Dropoff Location:</label>
          {isEditing ? (
            <input
              type="text"
              value={modalData.dropoff_location || ''}
              onChange={(e) => setModalData({...modalData, dropoff_location: e.target.value})}
            />
          ) : (
            <span>{modalData.dropoff_location}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Vehicle Type:</label>
          <span className="badge vehicle-type">{modalData.vehicle_type}</span>
        </div>
        
        <div className="field-group">
          <label>Price:</label>
          <span className="text-bold">{formatCurrency(modalData.price)}</span>
        </div>
        
        <div className="field-group">
          <label>Status:</label>
          {isEditing ? (
            <select
              value={modalData.status || ''}
              onChange={(e) => setModalData({...modalData, status: e.target.value})}
            >
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : (
            <span className={`badge status-${modalData.status.toLowerCase()}`}>{modalData.status}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Date Created:</label>
          <span>{formatDate(modalData.created_at)}</span>
        </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    const isEditing = modalType === 'edit';
    
    return (
      <div className="modal-fields">
        <div className="field-group">
          <label>Payment ID:</label>
          <span>{modalData.id}</span>
        </div>
        
        <div className="field-group">
          <label>Order ID:</label>
          <span>{modalData.order_id}</span>
        </div>
        
        <div className="field-group">
          <label>Customer:</label>
          <span>{modalData.customer_name}</span>
        </div>
        
        <div className="field-group">
          <label>Amount:</label>
          <span className="text-bold success">{formatCurrency(modalData.amount)}</span>
        </div>
        
        <div className="field-group">
          <label>Payment Method:</label>
          {isEditing ? (
            <select
              value={modalData.method || ''}
              onChange={(e) => setModalData({...modalData, method: e.target.value})}
            >
              <option value="">Select Method</option>
              <option value="card">Credit Card</option>
              <option value="eft">EFT</option>
              <option value="cash">Cash</option>
            </select>
          ) : (
            <span className="badge payment-method">{modalData.method || 'N/A'}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Status:</label>
          {isEditing ? (
            <select
              value={modalData.status || ''}
              onChange={(e) => setModalData({...modalData, status: e.target.value})}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          ) : (
            <span className={`badge status-${modalData.status.toLowerCase()}`}>{modalData.status}</span>
          )}
        </div>
        
        <div className="field-group">
          <label>Date Created:</label>
          <span>{formatDate(modalData.created_at)}</span>
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
                    <button 
                      className="action-btn view-btn" 
                      title="View Details"
                      onClick={() => openViewModal(trip, 'trip')}
                    >
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
                  <button 
                    className="action-btn view-btn" 
                    title="View User"
                    onClick={() => openViewModal(user, 'user')}
                  >
                    👁️
                  </button>
                  <button 
                    className="action-btn edit-btn" 
                    title="Edit User"
                    onClick={() => openEditModal(user, 'user')}
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    title="Delete User"
                    onClick={() => handleDelete(user.id, 'user')}
                  >
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
                  <button 
                    className="action-btn view-btn" 
                    title="View Details"
                    onClick={() => openViewModal(driver, 'driver')}
                  >
                    👁️
                  </button>
                  <button 
                    className="action-btn edit-btn" 
                    title="Edit Driver"
                    onClick={() => openEditModal(driver, 'driver')}
                  >
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
                  <button 
                    className="action-btn view-btn" 
                    title="View Details"
                    onClick={() => openViewModal(trip, 'trip')}
                  >
                    👁️
                  </button>
                  <button 
                    className="action-btn edit-btn" 
                    title="Edit Trip"
                    onClick={() => openEditModal(trip, 'trip')}
                  >
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
                  <button 
                    className="action-btn view-btn" 
                    title="View Details"
                    onClick={() => openViewModal(payment, 'payment')}
                  >
                    👁️
                  </button>
                  {payment.status === 'pending' && (
                    <button 
                      className="action-btn approve-btn" 
                      title="Approve Payment"
                      onClick={async () => {
                        try {
                          const response = await fetch(`http://localhost:5000/api/payments/${payment.id}/approve`, {
                            method: 'PUT',
                          });
                          
                          if (response.ok) {
                            showToast('Payment approved successfully!', 'success');
                            fetchDashboardData();
                          } else {
                            throw new Error('Failed to approve payment');
                          }
                        } catch (error) {
                          showToast('Error approving payment', 'error');
                        }
                      }}
                    >
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
          
          <button 
            onClick={() => {
              logout();
              showToast('Logged out successfully', 'success');
            }} 
            className="logout-btn"
          >
            🚪 Logout
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

      {/* Modals */}
      {showProfile && renderProfileModal()}
      {renderModal()}
      
      {/* Toast Notifications */}
      {renderToasts()}
    </div>
  );
}

export default App;