import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  MailOutlined,
  PhoneOutlined,
  SearchOutlined,
  StopOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, notification } from 'antd';
import { userService } from '../services/userService';
import '../../../styles/admin/customers_page.css';

const starterCustomers = [
  {
    id: 'CUS-4289',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+1 555-910-2231',
    profileImage: '',
    dateOfBirth: '1994-02-19',
    gender: 'Female',
    address: '1408 Walnut Street',
    city: 'Seattle',
    preferredService: 'Deep Cleaning',
    specialNotes: 'Prefers morning schedule and eco-friendly products.',
    status: 'Active',
    totalBookings: 24,
    customerTier: 'Regular',
    joiningDate: 'Apr 14, 2023',
    lastBookingDate: 'Oct 24, 2023',
  },
  {
    id: 'CUS-5520',
    name: 'David Miller',
    email: 'd.miller@example.com',
    phone: '+1 555-710-4098',
    profileImage: '',
    dateOfBirth: '1992-07-05',
    gender: 'Male',
    address: '22 Cedar Avenue',
    city: 'Portland',
    preferredService: 'Standard Cleaning',
    specialNotes: 'Usually books weekends.',
    status: 'Active',
    totalBookings: 12,
    customerTier: 'One-Time / Monthly',
    joiningDate: 'Aug 02, 2023',
    lastBookingDate: 'Oct 15, 2023',
  },
  {
    id: 'CUS-6614',
    name: 'Emma Thompson',
    email: 'emma.t@example.com',
    phone: '+1 555-440-2382',
    profileImage: '',
    dateOfBirth: '1998-11-11',
    gender: 'Female',
    address: '75 River Lane',
    city: 'Tacoma',
    preferredService: 'Window Washing',
    specialNotes: 'First booking in progress.',
    status: 'Inactive',
    totalBookings: 3,
    customerTier: 'New Customer',
    joiningDate: 'Sep 16, 2023',
    lastBookingDate: 'Sep 28, 2023',
  },
  {
    id: 'CUS-7331',
    name: 'Michael Brown',
    email: 'm.brown@example.com',
    phone: '+1 555-333-1093',
    profileImage: '',
    dateOfBirth: '1988-04-27',
    gender: 'Male',
    address: '11 Bayview Drive',
    city: 'Bellevue',
    preferredService: 'Office Maintenance',
    specialNotes: 'Business account, requires invoice monthly.',
    status: 'Active',
    totalBookings: 8,
    customerTier: 'Regular',
    joiningDate: 'Jul 08, 2023',
    lastBookingDate: 'Oct 21, 2023',
  },
  {
    id: 'CUS-8125',
    name: 'Robert King',
    email: 'r.king@example.com',
    phone: '+1 555-803-1140',
    profileImage: '',
    dateOfBirth: '1986-01-13',
    gender: 'Male',
    address: '300 Main Street',
    city: 'Seattle',
    preferredService: 'Premium Care',
    specialNotes: 'VIP package with priority slots.',
    status: 'Active',
    totalBookings: 42,
    customerTier: 'VIP',
    joiningDate: 'Jan 12, 2023',
    lastBookingDate: 'Oct 25, 2023',
  },
];

const statusFilters = ['All', 'Active', 'Inactive'];

const getInitials = (fullName) => {
  const [first = '', last = ''] = fullName.split(' ');
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;

const normalizeProfileImage = (avatar) => {
  if (!avatar) return '';
  const value = String(avatar).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`;
  if (value.startsWith('uploads/')) return `${API_BASE_URL}/${value}`;
  return value;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

const mapCustomerFromApi = (user) => {
  const fullName = user.username || user.email || `Customer ${user.user_id}`;
  const isActive = typeof user.is_active === 'boolean' ? user.is_active : true;

  return {
    id: String(user.user_id),
    name: fullName,
    email: user.email || '-',
    phone: user.phone_number || '-',
    profileImage: normalizeProfileImage(user.avatar),
    dateOfBirth: user.date_of_birth || '',
    gender: user.gender || '',
    address: user.address || '',
    city: user.city || '',
    preferredService: user.preferred_service || '',
    specialNotes: user.notes || '',
    status: isActive ? 'Active' : 'Inactive',
    totalBookings: Number(user?._count?.bookings || 0),
    customerTier: 'Regular',
    joiningDate: formatDate(user.created_at),
    lastBookingDate: '-',
  };
};

const CustomersPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [customers, setCustomers] = useState(starterCustomers.slice(0, 0));
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [formSection, setFormSection] = useState('account');
  const [viewSection, setViewSection] = useState('account');
  const [form] = Form.useForm();
  const profileImageValue = Form.useWatch('profileImage', form);
  const nameValue = Form.useWatch('name', form);
  const profileFileInputRef = useRef(null);
  const deleteTimeoutsRef = useRef(new Map());
  const deleteIntervalsRef = useRef(new Map());
  const deletedCustomersRef = useRef(new Map());
  const dismissedUndoRef = useRef(new Set());

  useEffect(() => () => {
    deleteTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    deleteIntervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
    deleteTimeoutsRef.current.clear();
    deleteIntervalsRef.current.clear();
    deletedCustomersRef.current.clear();
    dismissedUndoRef.current.clear();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadCustomers = async () => {
      try {
        const response = await userService.getUsers({ role: 'customer', page: 1, limit: 1000 });
        const rows = Array.isArray(response?.data) ? response.data : [];
        const mapped = rows.map(mapCustomerFromApi);

        if (isMounted) {
          setCustomers(mapped);
        }
      } catch (error) {
        if (!isMounted) return;
        setCustomers([]);
        notificationApi.error({
          placement: 'bottomRight',
          message: 'Failed to load customers',
          description: error?.response?.data?.message || 'Could not fetch customer data from backend database.',
          duration: 3,
        });
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, [notificationApi]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const target = `${customer.id} ${customer.name} ${customer.email} ${customer.phone}`.toLowerCase();
      const bySearch = target.includes(searchText.toLowerCase());
      const byStatus = statusFilter === 'All' || customer.status === statusFilter;
      return bySearch && byStatus;
    });
  }, [customers, searchText, statusFilter]);

  const pages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const page = Math.min(currentPage, pages);
  const pagedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => customer.status === 'Active').length;
  const inactiveCustomers = customers.filter((customer) => customer.status === 'Inactive').length;

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormSection('account');
    form.resetFields();
    form.setFieldsValue({
      status: 'Active',
      profileImage: '',
      gender: 'Female',
      customerTier: 'Regular',
      totalBookings: 0,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (customer) => {
    setFormSection('account');
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async () => {
    const values = await form.validateFields();

    if (editingCustomer) {
      setCustomers((prev) => prev.map((customer) => (
        customer.id === editingCustomer.id ? { ...customer, ...values } : customer
      )));
      notificationApi.success({
        placement: 'bottomRight',
        message: 'Customer updated successfully',
        duration: 2,
      });
    } else {
      const nowFormatted = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });
      const newCustomer = {
        ...values,
        id: `CUS-${Math.floor(Math.random() * 9000 + 1000)}`,
        joiningDate: nowFormatted,
        lastBookingDate: values.lastBookingDate || '-',
      };
      setCustomers((prev) => [...prev, newCustomer]);
      notificationApi.success({
        placement: 'bottomRight',
        message: 'Successfully added new customer',
        description: `${newCustomer.name} has been added to the customer list.`,
        btn: (
          <Button
            type="link"
            size="small"
            style={{ paddingInline: 0 }}
            onClick={() => {
              notificationApi.destroy();
              setEditingCustomer(null);
              setFormSection('account');
              form.resetFields();
              form.setFieldsValue({
                status: 'Active',
                profileImage: '',
                gender: 'Female',
                customerTier: 'Regular',
                totalBookings: 0,
              });
              setIsFormOpen(true);
            }}
          >
            Add more
          </Button>
        ),
      });
    }

    setIsFormOpen(false);
    form.resetFields();
  };

  const handleDeleteCustomer = (customer) => {
    Modal.confirm({
      title: `Delete ${customer.name}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => {
        setCustomers((prev) => {
          const index = prev.findIndex((item) => item.id === customer.id);
          if (index >= 0) {
            deletedCustomersRef.current.set(customer.id, { customer, index });
          }
          return prev.filter((item) => item.id !== customer.id);
        });

        const existingTimeout = deleteTimeoutsRef.current.get(customer.id);
        const existingInterval = deleteIntervalsRef.current.get(customer.id);
        if (existingTimeout) clearTimeout(existingTimeout);
        if (existingInterval) clearInterval(existingInterval);

        const messageKey = `delete-${customer.id}`;
        let secondsLeft = 20;
        dismissedUndoRef.current.delete(customer.id);

        const showUndoMessage = () => {
          if (dismissedUndoRef.current.has(customer.id)) return;

          notificationApi.open({
            key: messageKey,
            message: 'Customer deleted',
            placement: 'bottomRight',
            duration: 0,
            onClose: () => {
              if (deletedCustomersRef.current.has(customer.id)) {
                dismissedUndoRef.current.add(customer.id);
                const pendingInterval = deleteIntervalsRef.current.get(customer.id);
                if (pendingInterval) {
                  clearInterval(pendingInterval);
                  deleteIntervalsRef.current.delete(customer.id);
                }
              }
            },
            description: (
              <span>
                Tier: <strong>{customer.customerTier}</strong>. Undo in {secondsLeft}s.
              </span>
            ),
            btn: (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                onClick={() => {
                  const deletedEntry = deletedCustomersRef.current.get(customer.id);
                  if (!deletedEntry) return;

                  const pendingTimeout = deleteTimeoutsRef.current.get(customer.id);
                  const pendingInterval = deleteIntervalsRef.current.get(customer.id);
                  if (pendingTimeout) {
                    clearTimeout(pendingTimeout);
                    deleteTimeoutsRef.current.delete(customer.id);
                  }
                  if (pendingInterval) {
                    clearInterval(pendingInterval);
                    deleteIntervalsRef.current.delete(customer.id);
                  }

                  setCustomers((prev) => {
                    if (prev.some((item) => item.id === deletedEntry.customer.id)) {
                      return prev;
                    }
                    const next = [...prev];
                    const insertIndex = Math.min(deletedEntry.index, next.length);
                    next.splice(insertIndex, 0, deletedEntry.customer);
                    return next;
                  });

                  deletedCustomersRef.current.delete(customer.id);
                  dismissedUndoRef.current.delete(customer.id);
                  notificationApi.destroy(messageKey);
                  notificationApi.success({
                    placement: 'bottomRight',
                    message: `${customer.name} restored`,
                    duration: 2,
                  });
                }}
              >
                Undo
              </Button>
            ),
          });
        };

        const timeoutId = setTimeout(() => {
          deletedCustomersRef.current.delete(customer.id);
          dismissedUndoRef.current.delete(customer.id);
          deleteTimeoutsRef.current.delete(customer.id);
          const intervalId = deleteIntervalsRef.current.get(customer.id);
          if (intervalId) {
            clearInterval(intervalId);
            deleteIntervalsRef.current.delete(customer.id);
          }
          notificationApi.destroy(messageKey);
        }, 20000);

        const intervalId = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            clearInterval(intervalId);
            deleteIntervalsRef.current.delete(customer.id);
            return;
          }
          showUndoMessage();
        }, 1000);

        deleteTimeoutsRef.current.set(customer.id, timeoutId);
        deleteIntervalsRef.current.set(customer.id, intervalId);
        showUndoMessage();
      },
    });
  };

  const handleBlockToggle = (customer) => {
    const nextStatus = customer.status === 'Inactive' ? 'Active' : 'Inactive';
    setCustomers((prev) => prev.map((item) => (
      item.id === customer.id ? { ...item, status: nextStatus } : item
    )));
  };

  const openViewModal = (customer) => {
    setViewSection('account');
    setViewingCustomer(customer);
    setIsViewOpen(true);
  };

  const handleProfileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Invalid file',
        description: 'Please choose an image file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      form.setFieldsValue({ profileImage: reader.result });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <section className="admin-customers-page">
      {contextHolder}
      <header className="customers-header">
        <div>
          <h1 className="admin-page-title">Manage Customers</h1>
          <p className="admin-page-subtitle">View and manage your registered customer database.</p>
        </div>
      </header>

      <section className="customers-kpi-grid">
        <article className="customers-kpi-card">
          <div className="kpi-icon tone-blue"><TeamOutlined /></div>
          <span className="kpi-label">TOTAL CUSTOMERS</span>
          <h3>{totalCustomers.toLocaleString()}</h3>
          <span className="kpi-note neutral">Registered customer accounts</span>
        </article>
        <article className="customers-kpi-card">
          <div className="kpi-icon tone-green"><UserOutlined /></div>
          <span className="kpi-label">ACTIVE CUSTOMERS</span>
          <h3>{activeCustomers.toLocaleString()}</h3>
          <span className="kpi-note positive">Can place bookings now</span>
        </article>
        <article className="customers-kpi-card">
          <div className="kpi-icon tone-amber"><StopOutlined /></div>
          <span className="kpi-label">INACTIVE CUSTOMERS</span>
          <h3>{inactiveCustomers.toLocaleString()}</h3>
          <span className="kpi-note neutral">Temporarily blocked accounts</span>
        </article>
      </section>

      <section className="customers-list-header">
        <div className="section-copy">
          <h2 className="customers-section-title roboto roboto-700">Customers List</h2>
        </div>
        <div className="customers-header-actions">
          <div className="customers-search-box">
            <SearchOutlined />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            options={statusFilters.map((status) => ({ label: status === 'All' ? 'Status: All' : status, value: status }))}
            className="customers-filter-select"
          />
        </div>
      </section>

      <section className="customers-table-panel">
        <div className="table-scroll">
          <table className="customers-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PHONE NUMBER</th>
                <th>TOTAL BOOKINGS</th>
                <th>ACCOUNT STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pagedCustomers.length > 0 ? (
                pagedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar">
                          {customer.profileImage ? (
                            <img
                              src={customer.profileImage}
                              alt={customer.name}
                              className="avatar-img"
                              onError={(event) => { event.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            getInitials(customer.name)
                          )}
                        </span>
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="phone-cell">{customer.phone}</span>
                    </td>
                    <td>
                      <div className="bookings-cell">
                        <strong>{customer.totalBookings} Bookings</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag ${getStatusClass(customer.status)}`}>{customer.status}</span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button
                          className="plain-icon-btn action-view"
                          title="View customer"
                          type="button"
                          onClick={() => openViewModal(customer)}
                        >
                          <EyeOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-edit"
                          title={customer.status === 'Inactive' ? 'Unblock (Active)' : 'Block (Inactive)'}
                          type="button"
                          onClick={() => handleBlockToggle(customer)}
                        >
                          <StopOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-delete"
                          title="Delete customer"
                          type="button"
                          onClick={() => handleDeleteCustomer(customer)}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty" colSpan={6}>No customers found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <span>Showing {pagedCustomers.length} of {filteredCustomers.length} customers</span>
          <div className="pager">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="next"
              disabled={page === pages}
              onClick={() => setCurrentPage((prev) => Math.min(pages, prev + 1))}
            >
              Next
            </button>
          </div>
        </footer>
      </section>

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        open={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onOk={handleSaveCustomer}
        okText={editingCustomer ? 'Update Customer' : 'Create Customer'}
        width={760}
      >
        <div className="customer-profile-layout">
          <aside className="customer-profile-sidebar">
            <div className="profile-photo-card">
              <span className="avatar preview">
                {profileImageValue ? (
                  <img
                    src={normalizeProfileImage(profileImageValue)}
                    alt={nameValue || 'Customer profile'}
                    className="avatar-img"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  getInitials(nameValue || 'Customer Profile')
                )}
              </span>
            </div>
            <label htmlFor="customer-profile-file" className="change-photo-btn choose-label">
              Choose Profile
            </label>
            <input
              id="customer-profile-file"
              ref={profileFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              style={{ display: 'none' }}
            />
            <div className="profile-menu">
              <button
                type="button"
                className={formSection === 'account' ? 'active' : ''}
                onClick={() => setFormSection('account')}
              >
                <UserOutlined />
                Account Details
              </button>
              <button
                type="button"
                className={formSection === 'contact' ? 'active' : ''}
                onClick={() => setFormSection('contact')}
              >
                <EnvironmentOutlined />
                Contact Address
              </button>
              <button
                type="button"
                className={formSection === 'usage' ? 'active' : ''}
                onClick={() => setFormSection('usage')}
              >
                <CalendarOutlined />
                Booking Profile
              </button>
            </div>
          </aside>

          <div className="customer-profile-content">
            <h3>
              {formSection === 'account' && 'Account Details'}
              {formSection === 'contact' && 'Contact Address'}
              {formSection === 'usage' && 'Booking Profile'}
            </h3>
            <Form form={form} layout="vertical" className="customer-form-grid">
              {formSection === 'account' && (
                <>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter customer name' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="dateOfBirth" label="Date of Birth">
                    <Input type="date" />
                  </Form.Item>
                  <Form.Item name="gender" label="Gender">
                    <Select
                      options={[
                        { label: 'Female', value: 'Female' },
                        { label: 'Male', value: 'Male' },
                        { label: 'Other', value: 'Other' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="profileImage" label="Profile Photo URL" className="form-item-full">
                    <Input placeholder="https://example.com/photo.jpg" />
                  </Form.Item>
                </>
              )}

              {formSection === 'contact' && (
                <>
                  <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter phone number' }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="city" label="City">
                    <Input />
                  </Form.Item>
                  <Form.Item name="address" label="Address" className="form-item-full">
                    <Input />
                  </Form.Item>
                  <Form.Item name="specialNotes" label="Special Notes" className="form-item-full">
                    <Input.TextArea rows={3} placeholder="Any preference or note..." />
                  </Form.Item>
                </>
              )}

              {formSection === 'usage' && (
                <>
                  <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
                    <Select
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'Inactive', value: 'Inactive' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="customerTier" label="Customer Tier">
                    <Select
                      options={[
                        { label: 'VIP', value: 'VIP' },
                        { label: 'Regular', value: 'Regular' },
                        { label: 'New Customer', value: 'New Customer' },
                        { label: 'One-Time / Monthly', value: 'One-Time / Monthly' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="totalBookings" label="Total Bookings">
                    <Input type="number" min={0} />
                  </Form.Item>
                  <Form.Item name="preferredService" label="Preferred Service">
                    <Input />
                  </Form.Item>
                  <Form.Item name="lastBookingDate" label="Last Booking Date">
                    <Input type="date" />
                  </Form.Item>
                </>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      <Modal
        title="Customer Details"
        open={isViewOpen}
        onCancel={() => setIsViewOpen(false)}
        footer={null}
        width={760}
      >
        {viewingCustomer && (
          <div className="customer-profile-layout view-mode">
            <aside className="customer-profile-sidebar">
              <div className="profile-photo-card">
                <span className="avatar preview">
                  {viewingCustomer.profileImage ? (
                    <img
                      src={normalizeProfileImage(viewingCustomer.profileImage)}
                      alt={viewingCustomer.name}
                      className="avatar-img"
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    getInitials(viewingCustomer.name)
                  )}
                </span>
              </div>
              <div className="profile-menu">
                <button
                  type="button"
                  className={viewSection === 'account' ? 'active' : ''}
                  onClick={() => setViewSection('account')}
                >
                  <UserOutlined />
                  Account Details
                </button>
                <button
                  type="button"
                  className={viewSection === 'contact' ? 'active' : ''}
                  onClick={() => setViewSection('contact')}
                >
                  <EnvironmentOutlined />
                  Contact Address
                </button>
                <button
                  type="button"
                  className={viewSection === 'usage' ? 'active' : ''}
                  onClick={() => setViewSection('usage')}
                >
                  <CalendarOutlined />
                  Booking Profile
                </button>
              </div>
            </aside>

            <div className="customer-profile-content">
              <h3>
                {viewSection === 'account' && 'Account Details'}
                {viewSection === 'contact' && 'Contact Address'}
                {viewSection === 'usage' && 'Booking Profile'}
              </h3>

              {viewSection === 'account' && (
                <div className="customer-view-grid">
                  <p><strong>Full Name:</strong> {viewingCustomer.name || '-'}</p>
                  <p><strong>Email:</strong> {viewingCustomer.email || '-'}</p>
                  <p><strong>ID:</strong> {viewingCustomer.id || '-'}</p>
                  <p><strong>Status:</strong> <span className={`status-tag ${getStatusClass(viewingCustomer.status)}`}>{viewingCustomer.status}</span></p>
                  <p><strong>Gender:</strong> {viewingCustomer.gender || '-'}</p>
                  <p><strong>Date of Birth:</strong> {viewingCustomer.dateOfBirth || '-'}</p>
                </div>
              )}

              {viewSection === 'contact' && (
                <div className="customer-view-grid">
                  <p><strong><PhoneOutlined /> Phone:</strong> {viewingCustomer.phone || '-'}</p>
                  <p><strong><EnvironmentOutlined /> City:</strong> {viewingCustomer.city || '-'}</p>
                  <p><strong>Address:</strong> {viewingCustomer.address || '-'}</p>
                  <p><strong><MailOutlined /> Email:</strong> {viewingCustomer.email || '-'}</p>
                  <p className="form-item-full"><strong>Special Notes:</strong> {viewingCustomer.specialNotes || '-'}</p>
                </div>
              )}

              {viewSection === 'usage' && (
                <div className="customer-view-grid">
                  <p><strong>Customer Tier:</strong> {viewingCustomer.customerTier || '-'}</p>
                  <p><strong>Joining Date:</strong> {viewingCustomer.joiningDate || '-'}</p>
                  <p><strong>Total Bookings:</strong> {viewingCustomer.totalBookings ?? 0}</p>
                  <p><strong>Last Booking Date:</strong> {viewingCustomer.lastBookingDate || '-'}</p>
                  <p className="form-item-full"><strong>Preferred Service:</strong> {viewingCustomer.preferredService || '-'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default CustomersPage;
