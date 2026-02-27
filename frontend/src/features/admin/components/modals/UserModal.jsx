import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '../../../../components/common';
import './UserModal.scss';

const UserModal = ({ isOpen, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    status: 'active'
  });

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'customer',
        status: 'active'
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
    >
      <form onSubmit={handleSubmit} className="user-modal-form">
        <div className="form-group">
          <label>Full Name</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter full name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="Enter email"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder="Enter phone number"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Role</label>
            <Select
              value={formData.role}
              onChange={(value) => setFormData({...formData, role: value})}
              options={[
                { value: 'customer', label: 'Customer' },
                { value: 'cleaner', label: 'Cleaner' },
                { value: 'admin', label: 'Admin' }
              ]}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData({...formData, status: value})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'pending', label: 'Pending' }
              ]}
            />
          </div>
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {user ? 'Update' : 'Create'} User
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;