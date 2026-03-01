import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FilterOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StopOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Form, Input, Modal, Select, notification } from 'antd';
import '../../../styles/admin/cleaners_page.css';

const starterCleaners = [
  {
    id: 'CLN-9281',
    name: 'Marc Wilson',
    email: 'marc.wilson@example.com',
    phone: '+1 555-320-8181',
    profileImage: '',
    gender: 'Male',
    dateOfBirth: '1993-04-12',
    address: '23 King Street',
    city: 'Seattle',
    bio: 'Specialized in deep cleaning and post-renovation jobs.',
    emergencyContactName: 'Anna Wilson',
    emergencyContactPhone: '+1 555-908-1144',
    experienceYears: 5,
    status: 'Active',
    totalJobs: 142,
    rating: 4.9,
    reviews: 120,
    joiningDate: 'May 12, 2023',
  },
  {
    id: 'CLN-8842',
    name: 'Linda Key',
    email: 'linda.key@example.com',
    phone: '+1 555-920-1023',
    profileImage: '',
    gender: 'Female',
    dateOfBirth: '1991-11-03',
    address: '88 Pine Avenue',
    city: 'Portland',
    bio: 'Office and window cleaning expert with high customer ratings.',
    emergencyContactName: 'Daniel Key',
    emergencyContactPhone: '+1 555-303-1122',
    experienceYears: 4,
    status: 'Active',
    totalJobs: 86,
    rating: 4.7,
    reviews: 64,
    joiningDate: 'Aug 05, 2023',
  },
  {
    id: 'CLN-4421',
    name: 'James Cooper',
    email: 'j.cooper@example.com',
    phone: '+1 555-903-6441',
    profileImage: '',
    gender: 'Male',
    dateOfBirth: '1998-09-25',
    address: '104 River Road',
    city: 'Tacoma',
    bio: 'New cleaner currently completing onboarding and training.',
    emergencyContactName: 'Lora Cooper',
    emergencyContactPhone: '+1 555-991-0202',
    experienceYears: 1,
    status: 'Pending',
    totalJobs: 0,
    rating: 0,
    reviews: 0,
    joiningDate: 'Oct 20, 2023',
  },
  {
    id: 'CLN-3310',
    name: 'Robert King',
    email: 'r.king@example.com',
    phone: '+1 555-710-3310',
    profileImage: '',
    gender: 'Male',
    dateOfBirth: '1989-02-17',
    address: '16 Market Lane',
    city: 'Bellevue',
    bio: 'Senior cleaner with experience in premium residential services.',
    emergencyContactName: 'Rita King',
    emergencyContactPhone: '+1 555-811-4430',
    experienceYears: 7,
    status: 'Suspended',
    totalJobs: 214,
    rating: 4.2,
    reviews: 182,
    joiningDate: 'Jan 15, 2023',
  },
];

const statusFilters = ['All', 'Active', 'Pending', 'Suspended', 'Inactive'];
const ratingFilters = ['All', '4.5+', '4.0+', '3.5+'];

const getInitials = (fullName) => {
  const [first = '', last = ''] = fullName.split(' ');
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');

const CleanersPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [cleaners, setCleaners] = useState(starterCleaners);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [editingCleaner, setEditingCleaner] = useState(null);
  const [viewingCleaner, setViewingCleaner] = useState(null);
  const [formSection, setFormSection] = useState('account');
  const [viewSection, setViewSection] = useState('account');
  const [form] = Form.useForm();
  const profileImageValue = Form.useWatch('profileImage', form);
  const nameValue = Form.useWatch('name', form);
  const profileFileInputRef = useRef(null);
  const deleteTimeoutsRef = useRef(new Map());
  const deleteIntervalsRef = useRef(new Map());
  const deletedCleanersRef = useRef(new Map());
  const dismissedUndoRef = useRef(new Set());

  useEffect(() => {
    return () => {
      deleteTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      deleteIntervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
      deleteTimeoutsRef.current.clear();
      deleteIntervalsRef.current.clear();
      deletedCleanersRef.current.clear();
      dismissedUndoRef.current.clear();
    };
  }, []);

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) => {
      const target = `${cleaner.id} ${cleaner.name} ${cleaner.email}`.toLowerCase();
      const bySearch = target.includes(searchText.toLowerCase());
      const byStatus = statusFilter === 'All' || cleaner.status === statusFilter;
      const byRating = ratingFilter === 'All'
        || (ratingFilter === '4.5+' && cleaner.rating >= 4.5)
        || (ratingFilter === '4.0+' && cleaner.rating >= 4.0)
        || (ratingFilter === '3.5+' && cleaner.rating >= 3.5);
      return bySearch && byStatus && byRating;
    });
  }, [cleaners, searchText, statusFilter, ratingFilter]);

  const pages = Math.max(1, Math.ceil(filteredCleaners.length / pageSize));
  const page = Math.min(currentPage, pages);
  const pagedCleaners = filteredCleaners.slice((page - 1) * pageSize, page * pageSize);

  const totalCleaners = cleaners.length;
  const activeCount = cleaners.filter((cleaner) => cleaner.status === 'Active').length;
  const averageRating = cleaners.filter((cleaner) => cleaner.rating > 0)
    .reduce((sum, cleaner, _, arr) => sum + cleaner.rating / arr.length, 0);

  const openAddModal = () => {
    setEditingCleaner(null);
    setFormSection('account');
    form.resetFields();
    form.setFieldsValue({
      status: 'Pending',
      profileImage: '',
      gender: 'Male',
      experienceYears: 0,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (cleaner) => {
    setFormSection('account');
    setEditingCleaner(cleaner);
    form.setFieldsValue(cleaner);
    setIsFormOpen(true);
  };

  const handleSaveCleaner = async () => {
    const values = await form.validateFields();

    if (editingCleaner) {
      setCleaners((prev) => prev.map((cleaner) => (
        cleaner.id === editingCleaner.id ? { ...cleaner, ...values } : cleaner
      )));
      notificationApi.success({
        placement: 'bottomRight',
        message: 'Cleaner updated successfully',
        duration: 2,
      });
    } else {
      const newCleaner = {
        ...values,
        id: `CLN-${Math.floor(Math.random() * 9000 + 1000)}`,
        totalJobs: 0,
        rating: 0,
        reviews: 0,
        joiningDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      };
      setCleaners((prev) => [...prev, newCleaner]);
      notificationApi.success({
        placement: 'bottomRight',
        message: 'Successfully added new cleaner',
        description: `${newCleaner.name} has been added to the cleaner list.`,
        btn: (
          <Button
            type="link"
            size="small"
            style={{ paddingInline: 0 }}
            onClick={() => {
              notificationApi.destroy();
              setEditingCleaner(null);
              setFormSection('account');
              form.resetFields();
              form.setFieldsValue({
                status: 'Pending',
                profileImage: '',
                gender: 'Male',
                experienceYears: 0,
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

  const handleDeleteCleaner = (cleaner) => {
    Modal.confirm({
      title: `Delete ${cleaner.name}?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => {
        setCleaners((prev) => {
          const index = prev.findIndex((item) => item.id === cleaner.id);
          if (index >= 0) {
            deletedCleanersRef.current.set(cleaner.id, { cleaner, index });
          }
          return prev.filter((item) => item.id !== cleaner.id);
        });

        const existingTimeout = deleteTimeoutsRef.current.get(cleaner.id);
        const existingInterval = deleteIntervalsRef.current.get(cleaner.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        if (existingInterval) {
          clearInterval(existingInterval);
        }

        const messageKey = `delete-${cleaner.id}`;
        let secondsLeft = 20;
        dismissedUndoRef.current.delete(cleaner.id);

        const showUndoMessage = () => {
          if (dismissedUndoRef.current.has(cleaner.id)) return;

          notificationApi.open({
            key: messageKey,
            message: 'Cleaner deleted',
            placement: 'bottomRight',
            duration: 0,
            onClose: () => {
              if (deletedCleanersRef.current.has(cleaner.id)) {
                dismissedUndoRef.current.add(cleaner.id);
                const pendingInterval = deleteIntervalsRef.current.get(cleaner.id);
                if (pendingInterval) {
                  clearInterval(pendingInterval);
                  deleteIntervalsRef.current.delete(cleaner.id);
                }
              }
            },
            description: (
              <span>
                Status: <strong>{cleaner.status}</strong>. Undo in {secondsLeft}s.
              </span>
            ),
            btn: (
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                onClick={() => {
                  const deletedEntry = deletedCleanersRef.current.get(cleaner.id);
                  if (!deletedEntry) return;

                  const pendingTimeout = deleteTimeoutsRef.current.get(cleaner.id);
                  const pendingInterval = deleteIntervalsRef.current.get(cleaner.id);
                  if (pendingTimeout) {
                    clearTimeout(pendingTimeout);
                    deleteTimeoutsRef.current.delete(cleaner.id);
                  }
                  if (pendingInterval) {
                    clearInterval(pendingInterval);
                    deleteIntervalsRef.current.delete(cleaner.id);
                  }

                  setCleaners((prev) => {
                    if (prev.some((item) => item.id === deletedEntry.cleaner.id)) {
                      return prev;
                    }
                    const next = [...prev];
                    const insertIndex = Math.min(deletedEntry.index, next.length);
                    next.splice(insertIndex, 0, deletedEntry.cleaner);
                    return next;
                  });

                  deletedCleanersRef.current.delete(cleaner.id);
                  dismissedUndoRef.current.delete(cleaner.id);
                  notificationApi.destroy(messageKey);
                  notificationApi.success({
                    placement: 'bottomRight',
                    message: `${cleaner.name} restored`,
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
          deletedCleanersRef.current.delete(cleaner.id);
          dismissedUndoRef.current.delete(cleaner.id);
          deleteTimeoutsRef.current.delete(cleaner.id);
          const intervalId = deleteIntervalsRef.current.get(cleaner.id);
          if (intervalId) {
            clearInterval(intervalId);
            deleteIntervalsRef.current.delete(cleaner.id);
          }
          notificationApi.destroy(messageKey);
        }, 20000);

        const intervalId = setInterval(() => {
          secondsLeft -= 1;
          if (secondsLeft <= 0) {
            clearInterval(intervalId);
            deleteIntervalsRef.current.delete(cleaner.id);
            return;
          }
          showUndoMessage();
        }, 1000);

        deleteTimeoutsRef.current.set(cleaner.id, timeoutId);
        deleteIntervalsRef.current.set(cleaner.id, intervalId);
        showUndoMessage();
      },
    });
  };

  const handleBlockToggle = (cleaner) => {
    const nextStatus = cleaner.status === 'Inactive' ? 'Active' : 'Inactive';
    setCleaners((prev) => prev.map((item) => (
      item.id === cleaner.id ? { ...item, status: nextStatus } : item
    )));
  };

  const openViewModal = (cleaner) => {
    setViewSection('account');
    setViewingCleaner(cleaner);
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
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  return (
    <section className="admin-cleaners-page">
      {contextHolder}
      <header className="cleaners-header">
        <div>
          <h1 className="admin-page-title">Manage Cleaners</h1>
          <p className="admin-page-subtitle">Manage your cleaning staff, monitor performance and verify statuses.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="add-cleaner-btn" onClick={openAddModal}>
          Add Cleaner
        </Button>
      </header>

      <section className="cleaners-kpi-grid">
        <article className="cleaners-kpi-card">
          <div className="kpi-icon tone-blue"><TeamOutlined /></div>
          <span className="kpi-label">TOTAL CLEANERS</span>
          <h3>{totalCleaners}</h3>
          <span className="kpi-note positive">+5 new this week</span>
        </article>
        <article className="cleaners-kpi-card">
          <div className="kpi-icon tone-green"><ThunderboltOutlined /></div>
          <span className="kpi-label">ACTIVE NOW</span>
          <h3>{activeCount}</h3>
          <span className="kpi-note neutral">Currently on duty</span>
        </article>
        <article className="cleaners-kpi-card">
          <div className="kpi-icon tone-amber"><StarFilled /></div>
          <span className="kpi-label">AVERAGE RATING</span>
          <h3>{averageRating ? averageRating.toFixed(1) : 'N/A'}</h3>
          <span className="kpi-note positive">Top tier performance</span>
        </article>
      </section>

      <section className="cleaners-filter-row">
        <div className="search-box">
          <SearchOutlined />
          <input
            type="text"
            placeholder="Search by name, ID or email..."
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
          className="filter-select"
        />
        <Select
          value={ratingFilter}
          onChange={(value) => {
            setRatingFilter(value);
            setCurrentPage(1);
          }}
          options={ratingFilters.map((rating) => ({ label: rating === 'All' ? 'Rating' : rating, value: rating }))}
          className="filter-select"
        />
        <button type="button" className="compact-filter-btn" aria-label="more filters">
          <FilterOutlined />
        </button>
      </section>

      <section className="cleaners-table-panel">
        <div className="table-scroll">
          <table className="cleaners-table">
            <thead>
              <tr>
                <th>CLEANER</th>
                <th>STATUS</th>
                <th>TOTAL JOBS</th>
                <th>AVERAGE RATING</th>
                <th>JOINING DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pagedCleaners.length > 0 ? (
                pagedCleaners.map((cleaner) => (
                  <tr key={cleaner.id}>
                    <td>
                      <div className="cleaner-cell">
                        <span className="avatar">
                          {cleaner.profileImage ? (
                            <img src={cleaner.profileImage} alt={cleaner.name} className="avatar-img" />
                          ) : (
                            getInitials(cleaner.name)
                          )}
                        </span>
                        <div>
                          <strong>{cleaner.name}</strong>
                          <span>ID: {cleaner.id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-tag ${getStatusClass(cleaner.status)}`}>{cleaner.status}</span>
                    </td>
                    <td className="number-cell">{cleaner.totalJobs}</td>
                    <td className="rating-cell">
                      {cleaner.rating > 0 ? (
                        <>
                          <StarFilled />
                          <span>{cleaner.rating.toFixed(1)}</span>
                          <small>({cleaner.reviews})</small>
                        </>
                      ) : (
                        <span className="no-rating">N/A</span>
                      )}
                    </td>
                    <td>{cleaner.joiningDate}</td>
                    <td>
                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'view',
                              icon: <EyeOutlined />,
                              label: 'View',
                              onClick: () => openViewModal(cleaner),
                            },
                            {
                              key: 'edit',
                              icon: <EditOutlined />,
                              label: 'Edit',
                              onClick: () => openEditModal(cleaner),
                            },
                            {
                              key: 'block',
                              icon: <StopOutlined />,
                              label: cleaner.status === 'Inactive' ? 'Unblock (Active)' : 'Block (Inactive)',
                              onClick: () => handleBlockToggle(cleaner),
                            },
                            {
                              type: 'divider',
                            },
                            {
                              key: 'delete',
                              icon: <DeleteOutlined />,
                              label: 'Delete',
                              danger: true,
                              onClick: () => handleDeleteCleaner(cleaner),
                            },
                          ],
                        }}
                        trigger={['click']}
                      >
                        <button type="button" className="action-btn" aria-label={`actions for ${cleaner.name}`}>
                          <MoreOutlined />
                        </button>
                      </Dropdown>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty" colSpan={6}>No cleaners found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <span>Showing {pagedCleaners.length} of {filteredCleaners.length} cleaners</span>
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
        title={editingCleaner ? 'Edit Cleaner' : 'Add New Cleaner'}
        open={isFormOpen}
        onCancel={() => setIsFormOpen(false)}
        onOk={handleSaveCleaner}
        okText={editingCleaner ? 'Update Cleaner' : 'Create Cleaner'}
        width={760}
      >
        <div className="cleaner-profile-layout">
          <aside className="cleaner-profile-sidebar">
            <div className="profile-photo-card">
              <span className="avatar preview">
                {profileImageValue ? (
                  <img src={profileImageValue} alt={nameValue || 'Cleaner profile'} className="avatar-img" />
                ) : (
                  getInitials(nameValue || 'Cleaner Profile')
                )}
              </span>
            </div>
            <label htmlFor="cleaner-profile-file" className="change-photo-btn choose-label">
              Choose Profile
            </label>
            <button
              type="button"
              className="change-photo-btn preview-link"
              onClick={() => {
                if (!profileImageValue) return;
                setPreviewImage(profileImageValue);
                setIsProfilePreviewOpen(true);
              }}
              disabled={!profileImageValue}
            >
              Check Profile
            </button>
            <input
              id="cleaner-profile-file"
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
                className={formSection === 'work' ? 'active' : ''}
                onClick={() => setFormSection('work')}
              >
                <CreditCardOutlined />
                Work Details
              </button>
            </div>
          </aside>

          <div className="cleaner-profile-content">
            <h3>
              {formSection === 'account' && 'Account Details'}
              {formSection === 'contact' && 'Contact Address'}
              {formSection === 'work' && 'Work Details'}
            </h3>
            <Form form={form} layout="vertical" className="cleaner-form-grid">
              {formSection === 'account' && (
                <>
                  <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter cleaner name' }]}>
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
                        { label: 'Male', value: 'Male' },
                        { label: 'Female', value: 'Female' },
                        { label: 'Other', value: 'Other' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="profileImage" label="Profile Photo URL" className="form-item-full">
                    <Input placeholder="https://example.com/photo.jpg" />
                  </Form.Item>
                  <Form.Item name="bio" label="Bio" className="form-item-full">
                    <Input.TextArea rows={3} placeholder="Brief cleaner profile..." />
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
                  <Form.Item name="emergencyContactName" label="Emergency Contact Name">
                    <Input />
                  </Form.Item>
                  <Form.Item name="emergencyContactPhone" label="Emergency Contact Phone">
                    <Input />
                  </Form.Item>
                </>
              )}

              {formSection === 'work' && (
                <>
                  <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
                    <Select
                      options={[
                        { label: 'Active', value: 'Active' },
                        { label: 'Pending', value: 'Pending' },
                        { label: 'Suspended', value: 'Suspended' },
                        { label: 'Inactive', value: 'Inactive' },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="experienceYears" label="Experience (Years)">
                    <Input type="number" min={0} />
                  </Form.Item>
                </>
              )}
            </Form>
          </div>
        </div>
      </Modal>

      <Modal
        title="Cleaner Details"
        open={isViewOpen}
        onCancel={() => setIsViewOpen(false)}
        footer={null}
        width={760}
      >
        {viewingCleaner && (
          <div className="cleaner-profile-layout view-mode">
            <aside className="cleaner-profile-sidebar">
              <div className="profile-photo-card">
                <span className="avatar preview">
                  {viewingCleaner.profileImage ? (
                    <img src={viewingCleaner.profileImage} alt={viewingCleaner.name} className="avatar-img" />
                  ) : (
                    getInitials(viewingCleaner.name)
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
                  className={viewSection === 'work' ? 'active' : ''}
                  onClick={() => setViewSection('work')}
                >
                  <CreditCardOutlined />
                  Work Details
                </button>
              </div>
            </aside>

            <div className="cleaner-profile-content">
              <h3>
                {viewSection === 'account' && 'Account Details'}
                {viewSection === 'contact' && 'Contact Address'}
                {viewSection === 'work' && 'Work Details'}
              </h3>

              {viewSection === 'account' && (
                <div className="cleaner-view-grid">
                  <p><strong>Full Name:</strong> {viewingCleaner.name || '-'}</p>
                  <p><strong>Email:</strong> {viewingCleaner.email || '-'}</p>
                  <p><strong>Gender:</strong> {viewingCleaner.gender || '-'}</p>
                  <p><strong>Date of Birth:</strong> {viewingCleaner.dateOfBirth || '-'}</p>
                  <p><strong>ID:</strong> {viewingCleaner.id || '-'}</p>
                  <p><strong>Status:</strong> <span className={`status-tag ${getStatusClass(viewingCleaner.status)}`}>{viewingCleaner.status}</span></p>
                  <p className="cleaner-bio form-item-full"><strong>Bio:</strong> {viewingCleaner.bio || '-'}</p>
                </div>
              )}

              {viewSection === 'contact' && (
                <div className="cleaner-view-grid">
                  <p><strong>Phone:</strong> {viewingCleaner.phone || '-'}</p>
                  <p><strong>City:</strong> {viewingCleaner.city || '-'}</p>
                  <p><strong>Address:</strong> {viewingCleaner.address || '-'}</p>
                  <p><strong>Emergency Contact:</strong> {viewingCleaner.emergencyContactName || '-'} ({viewingCleaner.emergencyContactPhone || '-'})</p>
                </div>
              )}

              {viewSection === 'work' && (
                <div className="cleaner-view-grid">
                  <p><strong>Experience:</strong> {viewingCleaner.experienceYears ?? 0} years</p>
                  <p><strong>Joining Date:</strong> {viewingCleaner.joiningDate || '-'}</p>
                  <p><strong>Total Jobs:</strong> {viewingCleaner.totalJobs ?? 0}</p>
                  <p><strong>Rating:</strong> {viewingCleaner.rating > 0 ? `${viewingCleaner.rating.toFixed(1)} (${viewingCleaner.reviews} reviews)` : 'N/A'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Profile Preview"
        open={isProfilePreviewOpen}
        onCancel={() => setIsProfilePreviewOpen(false)}
        footer={null}
        width={420}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Cleaner profile preview"
              style={{ width: 280, height: 280, objectFit: 'cover', borderRadius: 12 }}
            />
          ) : (
            <span>No profile selected.</span>
          )}
        </div>
      </Modal>
    </section>
  );
};

export default CleanersPage;
