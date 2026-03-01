import React, { useState } from 'react';
import './styles/services_page.css';

const sampleServices = [
  {
    id: 1,
    title: 'House Cleaning',
    price: 80,
    unit: '/hr',
    description: 'Professional deep cleaning for residential properties including...'
  },
  {
    id: 2,
    title: 'Office Maintenance',
    price: 120,
    unit: '/hr',
    description: 'Tailored cleaning schedules for corporate offices, co-working spaces...'
  },
  {
    id: 3,
    title: 'Deep Sanitization',
    price: 150,
    unit: '/hr',
    description: 'Medical-grade disinfection and heavy-duty cleaning for post-...'
  }
];

const sampleInventory = [
  { id: 1, name: 'Eco-Glass Sparkling Spray', sku: 'CP-INV-001', category: 'Liquid Supplies', stock: 142 },
  { id: 2, name: 'Professional Microfiber Kit', sku: 'CP-INV-042', category: 'Equipment', stock: 8 },
  { id: 3, name: 'HEPA Filter Vacuum Bags', sku: 'CP-INV-018', category: 'Consumables', stock: 0 }
];

const ServicesPage = () => {
  const [services] = useState(sampleServices);
  const [inventory] = useState(sampleInventory);

  return (
    <div className="admin-services-page">
      <div className="services-header">
        <h2 className="section-title roboto roboto-700">Cleaning Services</h2>
        <p className="section-sub">Configure and manage your service offerings and pricing tiers.</p>
        <div className="actions">
          <button className="btn btn-primary roboto roboto-500">Add New Service</button>
        </div>
      </div>

      <div className="services-grid">
        {services.map((s) => (
          <div className="service-card" key={s.id}>
            <div className="service-media" aria-hidden>
              <div className="media-illustration" />
              <div className="service-actions">
                <button className="icon-btn" title="edit">✏️</button>
                <button className="icon-btn" title="delete">🗑️</button>
              </div>
            </div>
            <div className="service-body">
              <div className="service-row">
                <h3 className="service-title roboto roboto-600">{s.title}</h3>
                <div className="price roboto roboto-600">${s.price} <span className="unit">{s.unit}</span></div>
              </div>
              <p className="service-desc">{s.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="inventory-section">
        <div className="inventory-header">
          <h3 className="section-title roboto roboto-700">Cleaning Inventory & Shop</h3>
          <p className="section-sub">Manage stock levels for internal supplies and items available for purchase.</p>
          <div className="inventory-actions">
            <button className="btn btn-secondary roboto roboto-500">Stock Report</button>
            <button className="btn btn-primary roboto roboto-500">Add New Item</button>
          </div>
        </div>

        <div className="inventory-table-wrap">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Item</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((it) => (
                <tr key={it.id}>
                  <td className="product-cell">
                    <div className="product-info">
                      <div className="product-thumb" />
                      <div className="product-meta">
                        <div className="product-name roboto roboto-500">{it.name}</div>
                        <div className="product-sku">SKU: {it.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge category">{it.category}</span></td>
                  <td>
                    <div className="stock-row">
                      <div className="progress"><div className="bar" style={{ width: `${Math.min(100, it.stock)}%` }} /></div>
                      <div className="stock-count">{it.stock} units</div>
                    </div>
                  </td>
                  <td>
                    <button className="icon-btn">✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inventory-footer">
          <div className="pagination-info">Showing 1 to 3 of 48 inventory items</div>
          <div className="pagination-actions">
            <button className="btn">Previous</button>
            <button className="btn btn-primary">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;

