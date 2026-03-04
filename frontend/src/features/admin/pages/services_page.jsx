import React, { useEffect, useState } from 'react';
import './styles/services_page.css';
import { Form, Input, InputNumber, Modal, Select, Upload, message } from 'antd';
import homeImage from '../../../assets/home.png';
import officeImage from '../../../assets/office.png';
import windowImage from '../../../assets/window.png';
import shopImage from '../../../assets/shop.png';

const INVENTORY_PAGE_SIZE = 5;
const INVENTORY_CATEGORIES = ['LIQUID SUPPLIES', 'EQUIPMENT', 'CONSUMABLES', 'TOOLS', 'CHEMICALS'];

const sampleServices = [
  {
    id: 1,
    title: 'House Cleaning',
    price: 80,
    unit: '/hr',
    description: 'Professional deep cleaning for residential properties including...',
    image: homeImage
  },
  {
    id: 2,
    title: 'Office Maintenance',
    price: 120,
    unit: '/hr',
    description: 'Tailored cleaning schedules for corporate offices, co-working spaces...',
    image: officeImage
  },
  {
    id: 3,
    title: 'Deep Sanitization',
    price: 150,
    unit: '/hr',
    description: 'Medical-grade disinfection and heavy-duty cleaning for post-...',
    image: windowImage
  }
];

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
  const [services, setServices] = useState(sampleServices);
  const [inventory, setInventory] = useState(sampleInventory);
  const [inventoryPage, setInventoryPage] = useState(1);

  const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  const [isViewServiceOpen, setIsViewServiceOpen] = useState(false);
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
    serviceForm.setFieldsValue({ unit: '/hr', image: '' });
    setIsServiceFormOpen(true);
  };

  const openEditServiceForm = (service) => {
    setServiceFormMode('edit');
    setSelectedService(service);
    setServiceImageFileList([]);
    serviceForm.setFieldsValue({
      name: service.title,
      price: service.price,
      unit: service.unit,
      description: service.description,
      image: service.image?.startsWith('http') ? service.image : ''
    });
    setIsServiceFormOpen(true);
  };

  const openViewService = (service) => {
    setSelectedService(service);
    setIsViewServiceOpen(true);
  };

  const closeViewService = () => {
    setIsViewServiceOpen(false);
    setSelectedService(null);
  };

  const closeServiceForm = () => {
    setIsServiceFormOpen(false);
    setServiceImageFileList([]);
    setSelectedService(null);
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
      onOk: () => {
        setServices((prev) => prev.filter((item) => item.id !== service.id));
        message.success('Service deleted');
      }
    });
  };

  const handleCreateOrUpdateService = async (values) => {
    setIsSavingService(true);
    try {
      let image = values.image?.trim() || (isEditServiceMode ? selectedService?.image : homeImage);
      if (serviceImageFileList.length > 0 && serviceImageFileList[0].originFileObj) {
        image = await toDataUrl(serviceImageFileList[0].originFileObj);
      }

      const payload = {
        title: values.name.trim(),
        price: Number(values.price),
        unit: values.unit || '/hr',
        description: values.description.trim(),
        image
      };

      if (isEditServiceMode && selectedService) {
        setServices((prev) => prev.map((item) => (item.id === selectedService.id ? { ...item, ...payload } : item)));
        message.success('Service updated successfully');
      } else {
        setServices((prev) => [{ id: Date.now(), ...payload }, ...prev]);
        message.success('New service added successfully');
      }

      closeServiceForm();
    } catch (error) {
      message.error(isEditServiceMode ? 'Failed to update service' : 'Failed to add service');
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
      <section className="services-header">
        <div className="section-copy">
          <h2 className="svc-section-title roboto roboto-700">Cleaning Services</h2>
          <p className="svc-section-sub">Configure and manage your service offerings and pricing tiers.</p>
        </div>
        <button className="svc-btn svc-btn-primary roboto roboto-600" type="button" onClick={openServiceForm}>
          <i className="bi bi-plus-circle" aria-hidden="true" />
          Add New Service
        </button>
      </section>

      <div className="services-grid">
        {services.map((service) => (
          <article className="service-card" key={service.id}>
            <div className="service-media" aria-hidden>
              <img src={service.image} alt="" className="service-image" />
              <div className="service-actions">
                <button className="icon-btn" title="View service" type="button" onClick={() => openViewService(service)}>
                  <i className="bi bi-eye" aria-hidden="true" />
                </button>
                <button className="icon-btn" title="Edit service" type="button" onClick={() => openEditServiceForm(service)}>
                  <i className="bi bi-pencil" aria-hidden="true" />
                </button>
                <button className="icon-btn" title="Delete service" type="button" onClick={() => handleDeleteService(service)}>
                  <i className="bi bi-trash3" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="service-body">
              <div className="service-row">
                <h3 className="service-title roboto roboto-600">{service.title}</h3>
                <div className="service-price roboto roboto-700">
                  ${service.price}
                  <span className="service-unit">{service.unit}</span>
                </div>
              </div>
              <p className="service-desc">{service.description}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="inventory-section">
        <div className="inventory-header">
          <div className="section-copy">
            <h3 className="svc-section-title roboto roboto-700">Cleaning Inventory & Shop</h3>
            <p className="svc-section-sub">Manage stock levels for internal supplies and items available for purchase.</p>
          </div>
          <div className="inventory-actions">
            <button className="svc-btn svc-btn-secondary roboto roboto-600" type="button">
              <i className="bi bi-file-earmark-text" aria-hidden="true" />
              Stock Report
            </button>
            <button className="svc-btn svc-btn-dark roboto roboto-600" type="button" onClick={openInventoryForm}>
              <i className="bi bi-plus-square" aria-hidden="true" />
              Add New Item
            </button>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>PRODUCT ITEM</th>
                <th>CATEGORY</th>
                <th>STOCK LEVEL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {pagedInventory.length === 0 ? (
                <tr>
                  <td className="inventory-empty" colSpan={4}>No inventory items available.</td>
                </tr>
              ) : (
                pagedInventory.map((item) => {
                  const stockLabel = getStockLabel(item.stock);
                  return (
                    <tr key={item.id}>
                      <td className="product-cell">
                        <div className="product-info">
                          <img src={item.image} alt="" className="product-thumb" />
                          <div className="product-meta">
                            <div className="product-name roboto roboto-600">{item.name}</div>
                            <div className="product-sku">SKU: {item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`svc-badge svc-category svc-category-${stockLabel}`}>{item.category}</span>
                      </td>
                      <td>
                        <div className="stock-row">
                          <div className="svc-progress">
                            <div className={`svc-bar svc-bar-${stockLabel}`} style={{ width: `${getStockPercent(item.stock)}%` }} />
                          </div>
                          <div className="stock-count">{item.stock} units</div>
                        </div>
                      </td>
                      <td className="action-cell">
                        <div className="action-group">
                          <button className="plain-icon-btn" title="View item" type="button" onClick={() => openViewInventory(item)}>
                            <i className="bi bi-eye" aria-hidden="true" />
                          </button>
                          <button className="plain-icon-btn" title="Edit item" type="button" onClick={() => openEditInventoryForm(item)}>
                            <i className="bi bi-pencil" aria-hidden="true" />
                          </button>
                          <button className="plain-icon-btn" title="Delete item" type="button" onClick={() => handleDeleteInventory(item)}>
                            <i className="bi bi-trash3" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="inventory-footer">
            <div className="pagination-info">Showing {totalInventoryItems === 0 ? 0 : startIndex + 1} to {endIndex} of {totalInventoryItems} inventory items</div>
            <div className="pagination-actions">
              <button className="svc-btn svc-btn-secondary svc-btn-pager" type="button" disabled={currentPage === 1} onClick={() => setInventoryPage(1)}>
                First
              </button>
              <button className="svc-btn svc-btn-secondary svc-btn-pager" type="button" disabled={currentPage === 1} onClick={() => setInventoryPage((prev) => Math.max(1, prev - 1))}>
                Previous
              </button>
              <span className="pagination-page-label">Page {currentPage} of {totalInventoryPages}</span>
              <button className="svc-btn svc-btn-primary svc-btn-pager" type="button" disabled={currentPage === totalInventoryPages} onClick={() => setInventoryPage((prev) => Math.min(totalInventoryPages, prev + 1))}>
                Next
              </button>
              <button className="svc-btn svc-btn-secondary svc-btn-pager" type="button" disabled={currentPage === totalInventoryPages} onClick={() => setInventoryPage(totalInventoryPages)}>
                Last
              </button>
            </div>
          </div>
        </div>
      </section>

      <Modal
        title={isEditServiceMode ? 'Edit Service' : 'Add New Service'}
        open={isServiceFormOpen}
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
            <Form.Item label="Price" name="price" rules={[{ required: true, message: 'Please enter price' }]} className="service-form-item">
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
            </Form.Item>
            <Form.Item label="Unit" name="unit" rules={[{ required: true, message: 'Please select unit' }]} className="service-form-item">
              <Select options={[{ value: '/hr', label: '/hr' }, { value: '/visit', label: '/visit' }, { value: '/service', label: '/service' }]} />
            </Form.Item>
          </div>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }, { min: 20, message: 'Description should be at least 20 characters' }]}
          >
            <Input.TextArea rows={4} maxLength={180} showCount placeholder="Describe what this service includes..." />
          </Form.Item>

          <Form.Item
            label="Image URL (Optional)"
            name="image"
            rules={[{ type: 'url', warningOnly: true, message: 'Use a valid URL (or leave empty to use default image)' }]}
          >
            <Input placeholder="https://example.com/service-image.jpg" />
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
              {serviceImageFileList.length < 1 && (
                <div className="service-upload-trigger">
                  <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                  <span>Upload</span>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Service Details" open={isViewServiceOpen} onCancel={closeViewService} footer={null} destroyOnClose>
        {selectedService && (
          <div className="service-view-wrap">
            <img src={selectedService.image} alt={selectedService.title} className="service-view-image" />
            <div className="service-view-info">
              <h4 className="service-view-title">{selectedService.title}</h4>
              <p className="service-view-price">
                ${selectedService.price}
                <span>{selectedService.unit}</span>
              </p>
              <p className="service-view-description">{selectedService.description}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={isEditInventoryMode ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        open={isInventoryFormOpen}
        onCancel={closeInventoryForm}
        okText={isEditInventoryMode ? 'Save Changes' : 'Create Item'}
        cancelText="Cancel"
        onOk={() => inventoryForm.submit()}
        confirmLoading={isSavingInventory}
        destroyOnClose
      >
        <Form form={inventoryForm} layout="vertical" onFinish={handleCreateOrUpdateInventory}>
          <Form.Item label="Product Name" name="name" rules={[{ required: true, message: 'Please enter item name' }]}>
            <Input placeholder="e.g. Glass Cleaner Refill" />
          </Form.Item>

          <div className="inventory-form-row">
            <Form.Item label="SKU" name="sku" rules={[{ required: true, message: 'Please enter SKU' }]} className="inventory-form-item">
              <Input placeholder="CP-INV-999" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]} className="inventory-form-item">
              <Select options={INVENTORY_CATEGORIES.map((value) => ({ value, label: value }))} />
            </Form.Item>
          </div>

          <Form.Item label="Stock Level" name="stock" rules={[{ required: true, message: 'Please enter stock' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>

          <Form.Item label="Image URL (Optional)" name="image" rules={[{ type: 'url', warningOnly: true, message: 'Use a valid URL (or leave empty to use default image)' }]}>
            <Input placeholder="https://example.com/item-image.jpg" />
          </Form.Item>

          <Form.Item label="Upload Image">
            <Upload
              listType="picture-card"
              accept="image/*"
              beforeUpload={() => false}
              maxCount={1}
              fileList={inventoryImageFileList}
              onChange={({ fileList }) => setInventoryImageFileList(fileList)}
            >
              {inventoryImageFileList.length < 1 && (
                <div className="inventory-upload-trigger">
                  <i className="bi bi-cloud-arrow-up" aria-hidden="true" />
                  <span>Upload</span>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Inventory Item Details" open={isViewInventoryOpen} onCancel={closeViewInventory} footer={null} destroyOnClose>
        {selectedInventory && (
          <div className="inventory-view-wrap">
            <img src={selectedInventory.image} alt={selectedInventory.name} className="inventory-view-image" />
            <div className="inventory-view-info">
              <h4 className="inventory-view-title">{selectedInventory.name}</h4>
              <p className="inventory-view-meta">SKU: {selectedInventory.sku}</p>
              <p className="inventory-view-meta">Category: {selectedInventory.category}</p>
              <p className="inventory-view-meta">Stock: {selectedInventory.stock} units</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServicesPage;
