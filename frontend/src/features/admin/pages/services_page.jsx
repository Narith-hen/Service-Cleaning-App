import React, { useEffect, useMemo, useState } from 'react';
import './styles/services_page.css';
import { Form, Input, Modal, Select, Upload, message } from 'antd';
import { DeleteOutlined, EyeOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import shopImage from '../../../assets/shop.png';
import { serviceService } from '../services/serviceService';

const INVENTORY_PAGE_SIZE = 5;
const INVENTORY_CATEGORIES = ['LIQUID SUPPLIES', 'EQUIPMENT', 'CONSUMABLES', 'TOOLS', 'CHEMICALS'];

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const apiHost = rawApiBaseUrl.endsWith('/api') ? rawApiBaseUrl.slice(0, -4) : rawApiBaseUrl;
const toAbsoluteImageUrl = (imageUrl) => {
  if (!imageUrl) return homeImage;
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith('data:')) return imageUrl;
  return `${apiHost}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const mapServiceFromApi = (item) => ({
  id: item.service_id,
  title: item.name || 'Untitled service',
  description: item.description || '',
  status: String(item.status || 'active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
  image: toAbsoluteImageUrl(item.images?.[0]?.image_url)
});

const getUploadPreviewFileList = (imageUrl) => {
  if (!imageUrl) return [];
  return [
    {
      uid: '-1',
      name: 'current-image',
      status: 'done',
      url: imageUrl
    }
  ];
};

const sampleInventory = [
  { id: 1, name: 'Eco-Glass Sparkling Spray', sku: 'CP-INV-001', category: 'LIQUID SUPPLIES', stock: 142, image: shopImage },
  { id: 2, name: 'Professional Microfiber Kit', sku: 'CP-INV-042', category: 'EQUIPMENT', stock: 8, image: officeImage },
  { id: 3, name: 'HEPA Filter Vacuum Bags', sku: 'CP-INV-018', category: 'CONSUMABLES', stock: 0, image: windowImage },
  { id: 4, name: 'Industrial Mop Head', sku: 'CP-INV-051', category: 'TOOLS', stock: 45, image: homeImage },
  { id: 5, name: 'Bathroom Disinfectant', sku: 'CP-INV-025', category: 'CHEMICALS', stock: 75, image: shopImage },
  { id: 6, name: 'Surface Sanitizer Wipes', sku: 'CP-INV-033', category: 'CONSUMABLES', stock: 22, image: officeImage },
  { id: 7, name: 'Vacuum Cleaner Belt', sku: 'CP-INV-066', category: 'TOOLS', stock: 12, image: windowImage },
  { id: 8, name: 'Floor Shine Liquid', sku: 'CP-INV-072', category: 'LIQUID SUPPLIES', stock: 98, image: homeImage }
];

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('All');
  const [serviceSortFilter, setServiceSortFilter] = useState('default');
  const [loadingServices, setLoadingServices] = useState(true);
  const [inventory, setInventory] = useState(sampleInventory);
  const [inventoryPage, setInventoryPage] = useState(1);

  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isViewServiceOpen, setIsViewServiceOpen] = useState(false);
  const [isLoadingServiceDetail, setIsLoadingServiceDetail] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceFormMode, setServiceFormMode] = useState('create');
  const [selectedService, setSelectedService] = useState(null);
  const [serviceImageFileList, setServiceImageFileList] = useState([]);
  const [serviceForm] = Form.useForm();

  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  const [isViewInventoryOpen, setIsViewInventoryOpen] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  const [inventoryFormMode, setInventoryFormMode] = useState('create');
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [inventoryImageFileList, setInventoryImageFileList] = useState([]);
  const [inventoryForm] = Form.useForm();

  const totalInventoryItems = inventory.length;
  const totalInventoryPages = Math.max(1, Math.ceil(totalInventoryItems / INVENTORY_PAGE_SIZE));
  const currentPage = Math.min(inventoryPage, totalInventoryPages);
  const startIndex = (currentPage - 1) * INVENTORY_PAGE_SIZE;
  const endIndex = Math.min(totalInventoryItems, startIndex + INVENTORY_PAGE_SIZE);
  const pagedInventory = inventory.slice(startIndex, endIndex);

  const isEditServiceMode = serviceFormMode === 'edit';
  const isEditInventoryMode = inventoryFormMode === 'edit';
  const filteredServices = useMemo(() => {
    const keyword = serviceSearch.trim().toLowerCase();
    const matched = services.filter((service) => {
      const title = String(service.title || '').toLowerCase();
      const status = service.status || 'Active';
      const searchMatched = !keyword || title.includes(keyword);
      const statusMatched = serviceStatusFilter === 'All' || status === serviceStatusFilter;
      return searchMatched && statusMatched;
    });

    if (serviceSortFilter === 'name-asc') {
      return [...matched].sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
    }

    if (serviceSortFilter === 'name-desc') {
      return [...matched].sort((a, b) => String(b.title || '').localeCompare(String(a.title || '')));
    }

    return matched;
  }, [services, serviceSearch, serviceStatusFilter, serviceSortFilter]);
  const totalServices = services.length;
  const activeServices = services.filter((item) => (item.status || 'Active') === 'Active').length;
  const inactiveServices = services.filter((item) => (item.status || 'Active') === 'Inactive').length;

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await serviceService.getServices({ page: 1, limit: 200 });
      const apiRows = Array.isArray(response?.data) ? response.data : [];
      setServices(apiRows.map(mapServiceFromApi));
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (inventoryPage > totalInventoryPages) {
      setInventoryPage(totalInventoryPages);
    }
  }, [inventoryPage, totalInventoryPages]);

  const getStockPercent = (value) => Math.max(0, Math.min(100, Math.round((value / 150) * 100)));

  const getStockLabel = (stock) => {
    if (stock <= 0) return 'empty';
    if (stock < 30) return 'low';
    return 'high';
  };

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const openServiceForm = () => {
    setServiceFormMode('create');
    setSelectedService(null);
    setServiceImageFileList([]);
    serviceForm.setFieldsValue({ status: 'Active' });
    setIsServiceFormOpen(true);
  };

  const openEditServiceForm = async (service) => {
    setIsLoadingServiceDetail(true);
    try {
      const response = await serviceService.getServiceById(service.id);
      const mapped = mapServiceFromApi(response?.data || {});
      setServiceFormMode('edit');
      setSelectedService(mapped);
      setServiceImageFileList(getUploadPreviewFileList(mapped.image));
      serviceForm.setFieldsValue({
        name: mapped.title,
        status: mapped.status || 'Active',
        description: mapped.description
      });
      setIsServiceFormOpen(true);
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      message.error(serverMessage || 'Failed to load service details');
    } finally {
      setIsLoadingServiceDetail(false);
    }
  };

  const openViewService = async (service) => {
    setIsLoadingServiceDetail(true);
    try {
      const response = await serviceService.getServiceById(service.id);
      const mapped = mapServiceFromApi(response?.data || {});
      setSelectedService(mapped);
      setIsViewServiceOpen(true);
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      message.error(serverMessage || 'Failed to load service details');
    } finally {
      setIsLoadingServiceDetail(false);
    }
  };

  const closeViewService = () => {
    setIsViewServiceOpen(false);
    setSelectedService(null);
  };

  const closeServiceForm = () => {
    setIsServiceFormOpen(false);
    setSelectedService(null);
    setServiceImageFileList([]);
    setServiceFormMode('create');
    serviceForm.resetFields();
  };

  const handleDeleteService = (service) => {
    Modal.confirm({
      title: 'Delete service?',
      content: `Are you sure you want to delete "${service.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await serviceService.deleteService(service.id);
          await fetchServices();
          message.success('Service deleted');
        } catch (error) {
          const serverMessage = error?.response?.data?.message;
          message.error(serverMessage || 'Failed to delete service');
        }
      }
    });
  };

  const handleCreateOrUpdateService = async (values) => {
    setIsSavingService(true);
    try {
      const uploadedFile = serviceImageFileList[0]?.originFileObj;

      const payload = {
        name: values.name.trim(),
        description: values.description.trim(),
        status: (values.status || 'Active').toLowerCase()
      };

      if (isEditServiceMode && selectedService) {
        const updateRes = await serviceService.updateService(selectedService.id, payload);
        const serviceId = updateRes?.data?.service_id || updateRes?.service_id || selectedService.id;
        if (uploadedFile) {
          await serviceService.uploadServiceImage(serviceId, uploadedFile);
        }
        await fetchServices();
        message.success('Service updated successfully');
      } else {
        const createRes = await serviceService.createService(payload);
        const serviceId = createRes?.data?.service_id || createRes?.service_id;
        if (uploadedFile && serviceId) {
          await serviceService.uploadServiceImage(serviceId, uploadedFile);
        }
        await fetchServices();
        message.success('New service added successfully');
      }

      closeServiceForm();
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      message.error({
        key: 'service-save-error',
        content: serverMessage || (isEditServiceMode ? 'Failed to update service' : 'Failed to add service')
      });
    } finally {
      setIsSavingService(false);
    }
  };

  const openInventoryForm = () => {
    setInventoryFormMode('create');
    setSelectedInventory(null);
    setInventoryImageFileList([]);
    inventoryForm.setFieldsValue({ category: INVENTORY_CATEGORIES[0], stock: 0, image: '' });
    setIsInventoryFormOpen(true);
  };

  const openEditInventoryForm = (item) => {
    setInventoryFormMode('edit');
    setSelectedInventory(item);
    setInventoryImageFileList([]);
    inventoryForm.setFieldsValue({
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      image: item.image?.startsWith('http') ? item.image : ''
    });
    setIsInventoryFormOpen(true);
  };

  const openViewInventory = (item) => {
    setSelectedInventory(item);
    setIsViewInventoryOpen(true);
  };

  const closeViewInventory = () => {
    setIsViewInventoryOpen(false);
    setSelectedInventory(null);
  };

  const closeInventoryForm = () => {
    setIsInventoryFormOpen(false);
    setInventoryImageFileList([]);
    setSelectedInventory(null);
    setInventoryFormMode('create');
    inventoryForm.resetFields();
  };

  const handleDeleteInventory = (item) => {
    Modal.confirm({
      title: 'Delete inventory item?',
      content: `Delete "${item.name}" from inventory? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        setInventory((prev) => prev.filter((entry) => entry.id !== item.id));
        message.success('Inventory item deleted');
      }
    });
  };

  const handleCreateOrUpdateInventory = async (values) => {
    setIsSavingInventory(true);
    try {
      let image = values.image?.trim() || (isEditInventoryMode ? selectedInventory?.image : shopImage);
      if (inventoryImageFileList.length > 0 && inventoryImageFileList[0].originFileObj) {
        image = await toDataUrl(inventoryImageFileList[0].originFileObj);
      }

      const payload = {
        name: values.name.trim(),
        sku: values.sku.trim().toUpperCase(),
        category: values.category,
        stock: Number(values.stock),
        image
      };

      if (isEditInventoryMode && selectedInventory) {
        setInventory((prev) => prev.map((entry) => (entry.id === selectedInventory.id ? { ...entry, ...payload } : entry)));
        message.success('Inventory item updated');
      } else {
        setInventory((prev) => [{ id: Date.now(), ...payload }, ...prev]);
        setInventoryPage(1);
        message.success('Inventory item added');
      }

      closeInventoryForm();
    } catch (error) {
      message.error(isEditInventoryMode ? 'Failed to update inventory item' : 'Failed to add inventory item');
    } finally {
      setIsSavingInventory(false);
    }
  };

  return (
    <div className="admin-services-page">
      <header className="services-page-intro">
        <div>
          <h1 className="admin-page-title">Manage Services</h1>
          <p className="admin-page-subtitle">Configure and manage your service offerings and pricing tiers.</p>
        </div>
        <button className="svc-btn svc-btn-primary roboto roboto-600" type="button" onClick={openServiceForm}>
          <i className="bi bi-plus-circle" aria-hidden="true" />
          Add New Service
        </button>
      </header>

      <section className="services-kpi-grid">
        <article className="services-kpi-card">
          <div className="kpi-icon tone-blue">
            <i className="bi bi-grid-3x3-gap" aria-hidden="true" />
          </div>
          <span className="kpi-label">TOTAL SERVICES</span>
          <h3>{totalServices}</h3>
        </article>
        <article className="services-kpi-card">
          <div className="kpi-icon tone-green">
            <i className="bi bi-check-circle" aria-hidden="true" />
          </div>
          <span className="kpi-label">ACTIVE SERVICES</span>
          <h3>{activeServices}</h3>
        </article>
        <article className="services-kpi-card">
          <div className="kpi-icon tone-rose">
            <i className="bi bi-x-circle" aria-hidden="true" />
          </div>
          <span className="kpi-label">INACTIVE SERVICES</span>
          <h3>{inactiveServices}</h3>
        </article>
      </section>

      <section className="services-filter-row">
        <div className="services-search-box">
          <SearchOutlined />
          <input
            type="text"
            placeholder="Search service name..."
            value={serviceSearch}
            onChange={(event) => setServiceSearch(event.target.value)}
          />
        </div>
        <Select
          value={serviceStatusFilter}
          onChange={setServiceStatusFilter}
          options={[
            { value: 'All', label: 'Status: All' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' }
          ]}
          className="services-filter-select"
          popupClassName="service-filter-dropdown"
        />
        <Select
          value={serviceSortFilter}
          onChange={setServiceSortFilter}
          options={[
            { value: 'default', label: 'Sort: Default' },
            { value: 'name-asc', label: 'Name A-Z' },
            { value: 'name-desc', label: 'Name Z-A' }
          ]}
          className="services-filter-select"
          popupClassName="service-filter-dropdown"
        />
      </section>

      <div className="services-table-wrap">
        <table className="services-table">
          <thead>
            <tr>
              <th>SERVICE</th>
              <th>DESCRIPTION</th>
              <th>SERVICE STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loadingServices ? (
              <tr>
                <td className="services-empty" colSpan={4}>Loading services...</td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td className="services-empty" colSpan={4}>No services match your filters.</td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div className="service-list-cell">
                      <img src={service.image} alt={service.title} className="service-list-thumb" />
                      <span className="service-list-name roboto roboto-600">{service.title}</span>
                    </div>
                  </td>
                  <td>
                    <span className="service-list-description">{service.description}</span>
                  </td>
                  <td>
                    <span className={`service-status ${(service.status || 'Active').toLowerCase()}`}>
                      {service.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-group">
                      <button className="plain-icon-btn action-view" title="View service" type="button" onClick={() => openViewService(service)}>
                        <EyeOutlined />
                      </button>
                      <button className="plain-icon-btn action-edit" title="Edit service" type="button" onClick={() => openEditServiceForm(service)}>
                        <i className="bi bi-pencil" aria-hidden="true" />
                      </button>
                      <button className="plain-icon-btn action-delete" title="Delete service" type="button" onClick={() => handleDeleteService(service)}>
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        title={isEditServiceMode ? 'Edit Service' : 'Add New Service'}
        open={isServiceFormOpen}
        className="service-form-modal"
        onCancel={closeServiceForm}
        okText={isEditServiceMode ? 'Save Changes' : 'Create Service'}
        cancelText="Cancel"
        onOk={() => serviceForm.submit()}
        confirmLoading={isSavingService}
        destroyOnClose
      >
        <Form form={serviceForm} layout="vertical" onFinish={handleCreateOrUpdateService}>
          <Form.Item label="Service Name" name="name" rules={[{ required: true, message: 'Please enter service name' }]}>
            <Input placeholder="e.g. Move-Out Deep Cleaning" />
          </Form.Item>

          <div className="service-form-row">
            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]} className="service-form-item">
              <Select options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]} />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }, { min: 20, message: 'Description should be at least 20 characters' }]}
          >
            <Input.TextArea rows={4} maxLength={180} showCount placeholder="Describe what this service includes..." />
          </Form.Item>

          <Form.Item label="Upload Image">
            <Upload
              listType="picture-card"
              accept="image/*"
              beforeUpload={() => false}
              maxCount={1}
              fileList={serviceImageFileList}
              onChange={({ fileList }) => setServiceImageFileList(fileList)}
            >
              <div className="service-upload-trigger">
                <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                <span>{serviceImageFileList.length > 0 ? 'Change' : 'Upload'}</span>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Service Details" open={isViewServiceOpen} onCancel={closeViewService} footer={null} destroyOnClose>
        {isLoadingServiceDetail ? (
          <div className="services-empty">Loading service details...</div>
        ) : selectedService && (
          <div className="service-view-wrap">
            <img src={selectedService.image} alt={selectedService.title} className="service-view-image" />
            <div className="service-view-info">
              <h4 className="service-view-title">{selectedService.title}</h4>
              <span className={`service-status ${(selectedService.status || 'Active').toLowerCase()}`}>
                {selectedService.status || 'Active'}
              </span>
              <p className="service-view-description">{selectedService.description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServicesPage;
