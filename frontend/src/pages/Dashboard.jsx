import React from 'react';
import { useSelector } from 'react-redux';
import QuickActions from '../components/QuickActions';
import SmartDashboard from '../components/SmartDashboard';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <QuickActions user={user} />
      
      {/* Smart Dashboard */}
      <SmartDashboard />
    </div>
  );
};

export default Dashboard; 