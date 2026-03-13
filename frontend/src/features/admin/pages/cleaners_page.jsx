import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, notification } from 'antd';
import { cleanerService } from '../services/cleanerService';
import { serviceService } from '../services/serviceService';
import '../../../styles/admin/cleaners_page.css';

const statusFilters = ['All', 'Active', 'Suspended', 'Inactive'];
const ratingFilters = ['All', '4.5+', '4.0+', '3.5+'];
const defaultServiceTypeOptions = [
  { label: 'Home Cleaning', value: 'Home Cleaning' },
  { label: 'Office Cleaning', value: 'Office Cleaning' },
  { label: 'Deep Cleaning', value: 'Deep Cleaning' },
  { label: 'Move In / Move Out', value: 'Move In / Move Out' },
  { label: 'Post Construction', value: 'Post Construction' },
];
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const getInitials = (fullName) => {
  const [first = '', last = ''] = fullName.split(' ');
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
};

const getStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '-');
const normalizeStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return 'Active';
  if (value === 'pending') return 'Inactive';
  if (value === 'suspended') return 'Suspended';
  if (value === 'inactive') return 'Inactive';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const extractCleanerRows = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.cleaners)) return response.cleaners;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.payload)) return response.payload;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toRating = (value, fallback = 3) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const mapCleanerFromApi = (item) => ({
  id: String(
    item.id
    || item.cleanerCode
    || item.cleaner_code
    || item.cleaner_id
    || item.user_id
    || item.companyEmail
    || item.company_email
    || `ROW-${item.phone || item.phone_number || 'UNKNOWN'}`
  ),
  cleanerCode: item.cleaner_code || item.cleanerCode || null,
  name: item.name || item.companyName || item.company_name || 'Cleaner',
  email: item.email || item.companyEmail || item.company_email || '',
  phone: item.phone || item.phone_number || '',
  profileImage: toAbsoluteImageUrl(item.profileImage || item.profile_image || item.avatar || ''),
  companyName: item.companyName || item.company_name || item.name || '',
  companyEmail: item.companyEmail || item.company_email || item.email || '',
  teamMember: item.teamMember || item.team_member || '',
  serviceType: item.serviceType || item.service_type || '',
  address: item.address || '',
  latitude: item.latitude || '',
  longitude: item.longitude || '',
  status: normalizeStatus(item.status),
  totalJobs: toNumber(item.totalJobs ?? item.total_jobs),
  rating: toRating(item.rating ?? item.avg_rating, 3),
  reviews: toNumber(item.reviews ?? item.total_reviews),
  joiningDate: item.joiningDate
    || (item.created_at || item.createdAt
      ? new Date(item.created_at || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : '-'),
});

const CleanersPage = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  const [cleaners, setCleaners] = useState([]);
  const [cleanersLoading, setCleanersLoading] = useState(false);
  const [serviceTypeOptions, setServiceTypeOptions] = useState(defaultServiceTypeOptions);
  const [serviceOptionsLoading, setServiceOptionsLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingCleaner, setEditingCleaner] = useState(null);
  const [viewingCleaner, setViewingCleaner] = useState(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [form] = Form.useForm();
  const nameValue = Form.useWatch('companyName', form);
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

  const fetchCleaners = useCallback(async ({ silent = false, clearOnError = true } = {}) => {
    setCleanersLoading(true);
    try {
      const response = await cleanerService.getCleaners({ page: 1, limit: 1000 });
      const rows = extractCleanerRows(response);
      setCleaners(rows.map(mapCleanerFromApi));
      return true;
    } catch (error) {
      if (clearOnError) {
        setCleaners([]);
      }
      if (!silent) {
        notificationApi.error({
          placement: 'bottomRight',
          message: 'Failed to load cleaners',
          description: error?.response?.data?.message || 'Could not fetch cleaner data from backend database.',
          duration: 3,
        });
      }
      return false;
    } finally {
      setCleanersLoading(false);
    }
  }, [notificationApi]);

  useEffect(() => {
    fetchCleaners();
  }, [fetchCleaners]);

  useEffect(() => {
    const loadServiceTypes = async () => {
      setServiceOptionsLoading(true);
      try {
        const response = await serviceService.getServices({ page: 1, limit: 200 });
        const rows = Array.isArray(response?.data) ? response.data : [];
        const apiOptions = rows
          .map((item) => String(item?.name || '').trim())
          .filter(Boolean)
          .map((name) => ({ label: name, value: name }));

        const uniqueOptions = apiOptions.filter(
          (option, index, list) => list.findIndex((item) => item.value === option.value) === index
        );

        if (uniqueOptions.length > 0) {
          setServiceTypeOptions(uniqueOptions);
          return;
        }
        setServiceTypeOptions(defaultServiceTypeOptions);
      } catch {
        setServiceTypeOptions(defaultServiceTypeOptions);
      } finally {
        setServiceOptionsLoading(false);
      }
    };

    loadServiceTypes();
  }, []);

  const filteredCleaners = useMemo(() => {
    return cleaners.filter((cleaner) => {
      const target = `${cleaner.cleanerCode || ''} ${cleaner.name} ${cleaner.companyName || ''} ${cleaner.email} ${cleaner.phone || ''}`.toLowerCase();
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
  const pageStart = filteredCleaners.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, filteredCleaners.length);

  useEffect(() => {
    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [currentPage, pages]);

  const totalCleaners = cleaners.length;
  const activeCount = cleaners.filter((cleaner) => cleaner.status === 'Active').length;
  const inactiveCount = cleaners.filter((cleaner) => cleaner.status === 'Inactive').length;

  const openAddModal = () => {
    setEditingCleaner(null);
    setSelectedProfileFile(null);
    setProfilePreview('');
    form.resetFields();
    form.setFieldsValue({
      status: 'Inactive',
      profileImage: '',
      serviceType: undefined,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (cleaner) => {
    setEditingCleaner(cleaner);
    setSelectedProfileFile(null);
    setProfilePreview(cleaner.profileImage || '');
    form.setFieldsValue({
      ...cleaner,
      companyName: cleaner.companyName || cleaner.name,
      companyEmail: cleaner.companyEmail || cleaner.email,
      teamMember: cleaner.teamMember || '',
      serviceType: cleaner.serviceType || undefined,
      status: cleaner.status || 'Active',
      latitude: cleaner.latitude ?? '',
      longitude: cleaner.longitude ?? '',
      password: '',
      confirmPassword: '',
    });
    setIsFormOpen(true);
  };

  const handleSaveCleaner = async () => {
    try {
      const values = await form.validateFields();
      if (!editingCleaner && !selectedProfileFile) {
        notificationApi.error({
          placement: 'bottomRight',
          message: 'Profile image required',
          description: 'Please upload a profile image before creating cleaner.',
        });
        return;
      }

      if (editingCleaner) {
        const updatePayload = {
          companyName: values.companyName,
          companyEmail: values.companyEmail,
          phoneNumber: values.phone,
          teamMember: values.teamMember,
          serviceType: values.serviceType,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          status: values.status,
          profileFile: selectedProfileFile,
        };
        if (values.password) {
          updatePayload.password = values.password;
        }

        const response = await cleanerService.updateCleaner(editingCleaner.id, updatePayload);
        const updatedCleaner = response?.data ? mapCleanerFromApi(response.data) : null;
        if (updatedCleaner) {
          setCleaners((prev) => prev.map((cleaner) => (
            cleaner.id === editingCleaner.id ? updatedCleaner : cleaner
          )));
        }
        await fetchCleaners({ silent: true, clearOnError: false });
        notificationApi.success({
          placement: 'bottomRight',
          message: 'Cleaner updated successfully',
          duration: 2,
        });
      } else {
        const createPayload = {
          companyName: values.companyName,
          companyEmail: values.companyEmail,
          phoneNumber: values.phone,
          teamMember: values.teamMember,
          serviceType: values.serviceType,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          profileFile: selectedProfileFile,
          password: values.password,
        };

        const response = await cleanerService.createCleaner(createPayload);
        const createdCleaner = response?.data ? mapCleanerFromApi(response.data) : null;
        if (createdCleaner) {
          setCleaners((prev) => [createdCleaner, ...prev]);
        }
        await fetchCleaners({ silent: true, clearOnError: false });

        notificationApi.success({
          placement: 'bottomRight',
          message: 'Successfully added new cleaner',
          description: `${values.companyName} has been added to the cleaner list.`,
          btn: (
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => {
                notificationApi.destroy();
                setEditingCleaner(null);
                setSelectedProfileFile(null);
                setProfilePreview('');
                form.resetFields();
                form.setFieldsValue({
                  profileImage: '',
                  serviceType: undefined,
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
      setSelectedProfileFile(null);
      setProfilePreview('');
      form.resetFields();
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        notificationApi.error({
          placement: 'bottomRight',
          message: 'Failed to save cleaner',
          description: serverMessage,
        });
      }
    }
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

  const handleBlockToggle = async (cleaner) => {
    const nextStatus = cleaner.status === 'Inactive' ? 'Active' : 'Inactive';
    try {
      const response = await cleanerService.updateCleaner(cleaner.id, { status: nextStatus });
      const updatedCleaner = response?.data ? mapCleanerFromApi(response.data) : null;

      if (updatedCleaner) {
        setCleaners((prev) => prev.map((item) => (
          item.id === cleaner.id ? updatedCleaner : item
        )));
      } else {
        setCleaners((prev) => prev.map((item) => (
          item.id === cleaner.id ? { ...item, status: nextStatus } : item
        )));
      }
    } catch (error) {
      notificationApi.error({
        placement: 'bottomRight',
        message: 'Failed to update cleaner status',
        description: error?.response?.data?.message || 'Could not save status change to database.',
        duration: 3,
      });
    }
  };

  const openViewModal = (cleaner) => {
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
      setSelectedProfileFile(file);
      setProfilePreview(String(reader.result || ''));
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
        </article>
        <article className="cleaners-kpi-card">
          <div className="kpi-icon tone-green"><ThunderboltOutlined /></div>
          <span className="kpi-label">ACTIVE CLEANERS</span>
          <h3>{activeCount}</h3>
        </article>
        <article className="cleaners-kpi-card">
          <div className="kpi-icon tone-amber"><StarFilled /></div>
          <span className="kpi-label">INACTIVE CLEANERS</span>
          <h3>{inactiveCount}</h3>
        </article>
      </section>

      <section className="cleaners-filter-row">
        <div className="cleaners-search-box">
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
          className="cleaners-filter-select cleaners-filter-select-status"
        />
        <Select
          value={ratingFilter}
          onChange={(value) => {
            setRatingFilter(value);
            setCurrentPage(1);
          }}
          options={ratingFilters.map((rating) => ({ label: rating === 'All' ? 'Rating' : rating, value: rating }))}
          className="cleaners-filter-select cleaners-filter-select-rating"
        />
      </section>

      <section className="cleaners-table-panel">
        <div className="table-scroll">
          <table className="cleaners-table">
            <thead>
              <tr>
                <th>CLEANER</th>
                <th>COMPANY NAME</th>
                <th>PHONE NUMBER</th>
                <th className="jobs-center">TOTAL JOBS</th>
                <th className="rating-center">AVERAGE RATING</th>
                <th className="status-center">ACCOUNT STATUS</th>
                <th className="actions-center">ACTIONS</th>
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
                        <div className="cleaner-cell-meta">
                          <strong>{cleaner.name}</strong>
                          <span className="cleaner-code-line">Cleaner Code: {cleaner.cleanerCode || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{cleaner.companyName || cleaner.name || '-'}</td>
                    <td>{cleaner.phone || '-'}</td>
                    <td className="number-cell jobs-center">{cleaner.totalJobs}</td>
                    <td className="rating-center">
                      {cleaner.rating > 0 ? (
                        <span className="rating-cell">
                          <StarFilled />
                          <span>{cleaner.rating.toFixed(1)}</span>
                          <small>({cleaner.reviews ?? 0})</small>
                        </span>
                      ) : (
                        <span className="no-rating">N/A</span>
                      )}
                    </td>
                    <td className="status-center">
                      <span className={`status-tag ${getStatusClass(cleaner.status)}`}>{cleaner.status}</span>
                    </td>
                    <td className="actions-center">
                      <div className="action-group">
                        <button
                          className="plain-icon-btn action-view"
                          title="View cleaner"
                          type="button"
                          onClick={() => openViewModal(cleaner)}
                        >
                          <EyeOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-edit"
                          title="Edit cleaner"
                          type="button"
                          onClick={() => openEditModal(cleaner)}
                        >
                          <EditOutlined />
                        </button>
                        <button
                          className="plain-icon-btn action-delete"
                          title="Delete cleaner"
                          type="button"
                          onClick={() => handleDeleteCleaner(cleaner)}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty" colSpan={7}>
                    {cleanersLoading ? 'Loading cleaners...' : 'No cleaners found for current filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="table-footer">
          <span>Showing {pageStart}-{pageEnd} of {filteredCleaners.length} cleaners</span>
          <div className="pager">
            <span className="rows-label">Rows per page</span>
            <Select
              value={pageSize}
              onChange={(value) => {
                setPageSize(value);
                setCurrentPage(1);
              }}
              options={[10, 20, 50].map((value) => ({ label: value, value }))}
              className="page-size-select"
            />
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
        rootClassName="cleaner-form-modal"
        open={isFormOpen}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedProfileFile(null);
          setProfilePreview('');
        }}
        onOk={handleSaveCleaner}
        okText={editingCleaner ? 'Update Cleaner' : 'Create Cleaner'}
        width={760}
      >
        <div className="cleaner-profile-layout">
          <aside className="cleaner-profile-sidebar">
            <div className="profile-photo-card">
              <span className="avatar preview">
                {profilePreview ? (
                  <img src={profilePreview} alt={nameValue || 'Cleaner profile'} className="avatar-img" />
                ) : (
                  getInitials(nameValue || 'Cleaner Profile')
                )}
              </span>
            </div>
            <label htmlFor="cleaner-profile-file" className="change-photo-btn choose-label">
              Choose Profile
            </label>
            <input
              id="cleaner-profile-file"
              ref={profileFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileUpload}
              style={{ display: 'none' }}
            />
          </aside>

          <div className="cleaner-profile-content">
            <h3>Create New Team Cleaners</h3>
            <Form form={form} layout="vertical" className="cleaner-form-grid">
              <Form.Item name="companyName" label="Company Name" rules={[{ required: true, message: 'Please enter company name' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="companyEmail" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter valid company email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Phone Number" rules={[{ required: true, message: 'Please enter phone number' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="teamMember" label="Team Member" rules={[{ required: true, message: 'Please enter team member information' }]}>
                <Input placeholder="e.g. 5 members" />
              </Form.Item>
              <Form.Item name="serviceType" label="Service Type" rules={[{ required: true, message: 'Please select service type' }]}>
                <Select
                  options={serviceTypeOptions}
                  loading={serviceOptionsLoading}
                  placeholder="--select service--"
                />
              </Form.Item>
              {editingCleaner && (
                <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Please select status' }]}>
                  <Select
                    options={statusFilters
                      .filter((status) => status !== 'All')
                      .map((status) => ({ label: status, value: status }))}
                  />
                </Form.Item>
              )}
              <Form.Item
                name="password"
                label="Password"
                rules={editingCleaner ? [] : [{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['password']}
                rules={[
                  ...(editingCleaner ? [] : [{ required: true, message: 'Please confirm password' }]),
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const password = getFieldValue('password');
                      if (!password && !value) return Promise.resolve();
                      if (value === password) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Re-enter password" />
              </Form.Item>
              <Form.Item name="address" label="Address" className="form-item-full" rules={[{ required: true, message: 'Please enter address' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="latitude" label="Latitude" rules={[{ required: true, message: 'Please enter latitude' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="longitude" label="Longitude" rules={[{ required: true, message: 'Please enter longitude' }]}>
                <Input />
              </Form.Item>
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
            </aside>

            <div className="cleaner-profile-content">
              <h3>Cleaner Details</h3>
              <div className="cleaner-view-grid">
                <p><strong>Company Name:</strong> {viewingCleaner.companyName || viewingCleaner.name || '-'}</p>
                <p><strong>Email:</strong> {viewingCleaner.companyEmail || viewingCleaner.email || '-'}</p>
                <p><strong>Phone Number:</strong> {viewingCleaner.phone || '-'}</p>
                <p><strong>Team Member:</strong> {viewingCleaner.teamMember || '-'}</p>
                <p><strong>Service Type:</strong> {viewingCleaner.serviceType || '-'}</p>
                <p><strong>Cleaner Code:</strong> {viewingCleaner.cleanerCode || '-'}</p>
                <p><strong>Status:</strong> <span className={`status-tag ${getStatusClass(viewingCleaner.status)}`}>{viewingCleaner.status}</span></p>
                <p><strong>Joining Date:</strong> {viewingCleaner.joiningDate || '-'}</p>
                <p><strong>Address:</strong> {viewingCleaner.address || '-'}</p>
                <p><strong>Latitude:</strong> {viewingCleaner.latitude || '-'}</p>
                <p><strong>Longitude:</strong> {viewingCleaner.longitude || '-'}</p>
                <p><strong>Total Jobs:</strong> {viewingCleaner.totalJobs ?? 0}</p>
                <p><strong>Rating:</strong> {viewingCleaner.rating > 0 ? `${viewingCleaner.rating.toFixed(1)} (${viewingCleaner.reviews ?? 0} reviews)` : 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};

export default CleanersPage;
