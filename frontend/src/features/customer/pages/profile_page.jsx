import React, { useState } from 'react';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+855 12 345 678',
    address: '123 Main Street, Phnom Penh',
    joinDate: 'January 2024',
    totalBookings: 12,
    totalSpent: 540
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>My Profile</h1>
      
      {/* Profile Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '20px',
        background: '#f0f7ff',
        borderRadius: '10px'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: '#007bff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '32px',
          marginRight: '20px'
        }}>
          {profile.name.charAt(0)}
        </div>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>{profile.name}</h2>
          <p style={{ margin: '0', color: '#666' }}>Member since {profile.joinDate}</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          style={{
            marginLeft: 'auto',
            padding: '10px 20px',
            background: isEditing ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? 'Save' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Info */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <label style={{ color: '#666', fontSize: '14px' }}>Full Name</label>
          {isEditing ? (
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => setProfile({...profile, name: e.target.value})}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          ) : (
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0' }}>{profile.name}</p>
          )}
        </div>

        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <label style={{ color: '#666', fontSize: '14px' }}>Email</label>
          {isEditing ? (
            <input 
              type="email" 
              value={profile.email}
              onChange={(e) => setProfile({...profile, email: e.target.value})}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          ) : (
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0' }}>{profile.email}</p>
          )}
        </div>

        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <label style={{ color: '#666', fontSize: '14px' }}>Phone</label>
          {isEditing ? (
            <input 
              type="tel" 
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          ) : (
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0' }}>{profile.phone}</p>
          )}
        </div>

        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px' }}>
          <label style={{ color: '#666', fontSize: '14px' }}>Address</label>
          {isEditing ? (
            <input 
              type="text" 
              value={profile.address}
              onChange={(e) => setProfile({...profile, address: e.target.value})}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          ) : (
            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '5px 0 0' }}>{profile.address}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          background: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Bookings</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>
            {profile.totalBookings}
          </p>
        </div>

        <div style={{ 
          background: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Total Spent</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: '#2e7d32' }}>
            ${profile.totalSpent}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={{ 
          padding: '10px 20px', 
          background: '#6c757d', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Change Password
        </button>
        <button style={{ 
          padding: '10px 20px', 
          background: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Delete Account
        </button>
      </div>

      {/* Cancel Edit Button */}
      {isEditing && (
        <button 
          onClick={() => setIsEditing(false)}
          style={{
            marginTop: '10px',
            padding: '10px',
            background: 'none',
            border: 'none',
            color: '#666',
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          Cancel Editing
        </button>
      )}
    </div>
  );
};

export default ProfilePage;