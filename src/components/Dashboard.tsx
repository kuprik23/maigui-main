import React, { useState, useEffect } from 'react';
import { Plan } from '../utils/stripe';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  subscription: {
    plan: string;
    status: string;
    monthlyMinutes: number;
  } | null;
}

interface UsageData {
  timeframe: string;
  totalUsage: {
    seconds: number;
    minutes: number;
  };
  subscription: {
    totalMinutes: number;
    remainingMinutes: number;
    percentUsed: number;
  };
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUser(userData);

        // Fetch usage data
        const usageResponse = await fetch('/api/users/usage', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!usageResponse.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const usageData = await usageResponse.json();
        setUsageData(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/login'}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-sidebar">
        <div className="dashboard-logo">
          <img src="/images/glassem3rsa.png" alt="Em3rsa Logo" />
        </div>
        <nav className="dashboard-nav">
          <ul>
            <li className={activeTab === 'overview' ? 'active' : ''}>
              <button onClick={() => setActiveTab('overview')}>Overview</button>
            </li>
            <li className={activeTab === 'usage' ? 'active' : ''}>
              <button onClick={() => setActiveTab('usage')}>Usage</button>
            </li>
            <li className={activeTab === 'subscription' ? 'active' : ''}>
              <button onClick={() => setActiveTab('subscription')}>Subscription</button>
            </li>
            <li className={activeTab === 'settings' ? 'active' : ''}>
              <button onClick={() => setActiveTab('settings')}>Settings</button>
            </li>
          </ul>
        </nav>
        <div className="dashboard-user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.name || 'Anonymous'}</p>
            <p className="user-email">{user?.email || 'No email'}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'usage' && 'Usage Analytics'}
            {activeTab === 'subscription' && 'Subscription Management'}
            {activeTab === 'settings' && 'Account Settings'}
          </h1>
          <div className="dashboard-actions">
            <button className="btn-logout" onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/login';
            }}>
              Logout
            </button>
          </div>
        </header>

        <div className="dashboard-main">
          {activeTab === 'overview' && (
            <div className="dashboard-overview">
              <div className="dashboard-card subscription-card">
                <h2>Subscription</h2>
                <div className="subscription-details">
                  <div className="subscription-plan">
                    <span className="plan-badge">{user?.subscription?.plan || 'No Plan'}</span>
                  </div>
                  <div className="subscription-status">
                    Status: <span className={`status-${user?.subscription?.status || 'inactive'}`}>
                      {user?.subscription?.status || 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="subscription-usage">
                  <div className="usage-bar">
                    <div 
                      className="usage-progress" 
                      style={{ width: `${usageData?.subscription.percentUsed || 0}%` }}
                    ></div>
                  </div>
                  <div className="usage-stats">
                    <span>{usageData?.totalUsage.minutes || 0} min used</span>
                    <span>{usageData?.subscription.remainingMinutes || 0} min remaining</span>
                  </div>
                </div>
                <button className="btn-upgrade" onClick={() => setActiveTab('subscription')}>
                  {user?.subscription?.plan === Plan.FREE ? 'Upgrade Plan' : 'Manage Subscription'}
                </button>
              </div>

              <div className="dashboard-card quick-stats">
                <h2>Quick Stats</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{usageData?.totalUsage.minutes || 0}</span>
                    <span className="stat-label">Minutes Used</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{usageData?.subscription.totalMinutes || 0}</span>
                    <span className="stat-label">Total Minutes</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{Math.round(usageData?.subscription.percentUsed || 0)}%</span>
                    <span className="stat-label">Usage</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="dashboard-usage">
              <div className="dashboard-card">
                <h2>Usage Analytics</h2>
                <div className="timeframe-selector">
                  <button className="btn-timeframe active">Month</button>
                  <button className="btn-timeframe">Week</button>
                  <button className="btn-timeframe">Year</button>
                </div>
                <div className="usage-chart">
                  {/* Chart would be implemented with a library like Chart.js */}
                  <div className="chart-placeholder">
                    <p>Usage chart will be displayed here</p>
                  </div>
                </div>
                <div className="usage-details">
                  <h3>Usage Breakdown</h3>
                  <table className="usage-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2025-02-27</td>
                        <td>15 min</td>
                        <td>Chat</td>
                      </tr>
                      <tr>
                        <td>2025-02-26</td>
                        <td>22 min</td>
                        <td>WebGL</td>
                      </tr>
                      <tr>
                        <td>2025-02-25</td>
                        <td>8 min</td>
                        <td>Chat</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="dashboard-subscription">
              <div className="dashboard-card">
                <h2>Subscription Plans</h2>
                <div className="plans-grid">
                  <div className={`plan-card ${user?.subscription?.plan === Plan.FREE ? 'current' : ''}`}>
                    <h3>Free</h3>
                    <div className="plan-price">$0</div>
                    <ul className="plan-features">
                      <li>5 minutes of AI interaction per month</li>
                      <li>Basic 3D visualization</li>
                      <li>Standard support</li>
                    </ul>
                    <button 
                      className="btn-select-plan"
                      disabled={user?.subscription?.plan === Plan.FREE}
                    >
                      {user?.subscription?.plan === Plan.FREE ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                  <div className={`plan-card ${user?.subscription?.plan === Plan.PRO ? 'current' : ''}`}>
                    <h3>Pro</h3>
                    <div className="plan-price">$50<span>/month</span></div>
                    <ul className="plan-features">
                      <li>500 minutes of AI interaction per month</li>
                      <li>Advanced 3D visualization</li>
                      <li>Priority support</li>
                      <li>Usage analytics</li>
                    </ul>
                    <button 
                      className="btn-select-plan"
                      disabled={user?.subscription?.plan === Plan.PRO}
                    >
                      {user?.subscription?.plan === Plan.PRO ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                  <div className={`plan-card ${user?.subscription?.plan === Plan.ENTERPRISE ? 'current' : ''}`}>
                    <h3>Enterprise</h3>
                    <div className="plan-price">Custom</div>
                    <ul className="plan-features">
                      <li>Unlimited AI interaction</li>
                      <li>Custom 3D models</li>
                      <li>Dedicated support</li>
                      <li>Advanced security features</li>
                      <li>Custom integrations</li>
                    </ul>
                    <button className="btn-contact-sales">
                      Contact Sales
                    </button>
                  </div>
                </div>
              </div>
              
              {user?.subscription?.plan !== Plan.FREE && (
                <div className="dashboard-card">
                  <h2>Billing Information</h2>
                  <div className="billing-info">
                    <div className="billing-row">
                      <span>Current Plan:</span>
                      <span>{user?.subscription?.plan}</span>
                    </div>
                    <div className="billing-row">
                      <span>Status:</span>
                      <span>{user?.subscription?.status}</span>
                    </div>
                    <div className="billing-row">
                      <span>Next Billing Date:</span>
                      <span>March 27, 2025</span>
                    </div>
                  </div>
                  <div className="billing-actions">
                    <button className="btn-cancel">Cancel Subscription</button>
                    <button className="btn-update-payment">Update Payment Method</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="dashboard-settings">
              <div className="dashboard-card">
                <h2>Profile Settings</h2>
                <form className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      defaultValue={user?.name || ''} 
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      defaultValue={user?.email || ''} 
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <button type="submit" className="btn-save">Save Changes</button>
                </form>
              </div>

              <div className="dashboard-card">
                <h2>Security</h2>
                <div className="security-option">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="btn-enable-2fa">Enable 2FA</button>
                </div>
                <div className="security-option">
                  <div className="security-info">
                    <h3>Security Logs</h3>
                    <p>View recent account activity</p>
                  </div>
                  <button className="btn-view-logs">View Logs</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
