'use client';

import { useState, useEffect } from 'react';
import useUser from '@/utils/useUser';

export default function AdminDashboard() {
  const { data: user, loading } = useUser();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      window.location.href = '/account/signin';
      return;
    }

    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [user, loading]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSignOut = () => {
    window.location.href = '/account/logout';
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF7B00] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-[#FF7B00] text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color = "bg-blue-500" }) => (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} p-3 rounded-full`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Investment Platform</h1>
              <p className="text-gray-600">Admin Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-[#FF7B00] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <a href="#" className="text-[#FF7B00] font-medium border-b-2 border-[#FF7B00] pb-2">
              Dashboard
            </a>
            <a href="/admin/users" className="text-gray-600 hover:text-[#FF7B00] pb-2">
              Users
            </a>
            <a href="/admin/investments" className="text-gray-600 hover:text-[#FF7B00] pb-2">
              Investments
            </a>
            <a href="/admin/loans" className="text-gray-600 hover:text-[#FF7B00] pb-2">
              Loans
            </a>
            <a href="/admin/transactions" className="text-gray-600 hover:text-[#FF7B00] pb-2">
              Transactions
            </a>
          </nav>
        </div>

        {loadingStats ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF7B00] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats?.total_users || 0}
                subtitle={`${stats?.pending_kyc || 0} pending KYC`}
                icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-2.748a4 4 0 00-5 4.748a4 4 0 005-4.748z"
                color="bg-blue-500"
              />
              <StatCard
                title="Total Investments"
                value={`$${(stats?.total_investments || 0).toLocaleString()}`}
                subtitle={`${stats?.active_investments || 0} active`}
                icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                color="bg-green-500"
              />
              <StatCard
                title="Outstanding Loans"
                value={`$${(stats?.outstanding_loans || 0).toLocaleString()}`}
                subtitle={`${stats?.active_loans || 0} active loans`}
                icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                color="bg-yellow-500"
              />
              <StatCard
                title="Daily Volume"
                value={`$${(stats?.daily_volume || 0).toLocaleString()}`}
                subtitle="Last 24 hours"
                icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                color="bg-purple-500"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Investments */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Investments</h3>
                <div className="space-y-4">
                  {stats?.recent_investments?.length ? (
                    stats.recent_investments.map((investment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">${investment.amount}</p>
                          <p className="text-sm text-gray-600">{investment.plan_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{investment.user_email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(investment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No recent investments</p>
                  )}
                </div>
              </div>

              {/* Pending Loan Applications */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Loan Applications</h3>
                <div className="space-y-4">
                  {stats?.pending_loans?.length ? (
                    stats.pending_loans.map((loan, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">${loan.amount}</p>
                          <p className="text-sm text-gray-600">{loan.purpose}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{loan.user_email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(loan.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No pending applications</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}