const db = require('../../config/db');

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'inactive' ? 'inactive' : 'active';
};

const mapServiceRow = (row) => ({
  service_id: row.service_id,
  name: row.name,
  description: row.description,
  status: normalizeStatus(row.status),
  images: row.image_url ? [{ image_url: row.image_url }] : []
});

const getServiceById = async (req, res, next) => {
  try {
    const serviceId = parseInt(req.params.id, 10);
    const promiseDb = db.promise();

    const [rows] = await promiseDb.query(
      `
        SELECT
          s.service_id,
          s.name,
          s.description,
          s.status,
          COALESCE((
            SELECT si.image_url
            FROM service_images si
            WHERE si.service_id = s.service_id
            ORDER BY si.id DESC
            LIMIT 1
          ), s.image) AS image_url
        FROM services s
        WHERE s.service_id = ?
        LIMIT 1
      `,
      [serviceId]
    );

    if (!rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mapServiceRow(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;
    const promiseDb = db.promise();

    const [services] = await promiseDb.query(
      `
        SELECT
          s.service_id,
          s.name,
          s.description,
          s.status,
          (
            SELECT si.image_url
            FROM service_images si
            WHERE si.service_id = s.service_id
            ORDER BY si.id DESC
            LIMIT 1
          ) AS image_url
        FROM services s
        ORDER BY s.service_id DESC
        LIMIT ?
        OFFSET ?
      `,
      [limit, skip]
    );

    const [countRows] = await promiseDb.query('SELECT COUNT(*) AS total FROM services');
    const total = Number(countRows?.[0]?.total || 0);

    res.status(200).json({
      success: true,
      data: services.map(mapServiceRow),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, description, status, image_url } = req.body;
    const promiseDb = db.promise();
    const normalizedStatus = normalizeStatus(status);

    const [insertResult] = await promiseDb.query(
      `
        INSERT INTO services (name, description, status, image)
        VALUES (?, ?, ?, ?)
      `,
      [name, description, normalizedStatus, image_url || null]
    );

    const serviceId = Number(insertResult.insertId);

    if (image_url) {
      await promiseDb.query(
        'INSERT INTO service_images (image_url, service_id) VALUES (?, ?)',
        [image_url, serviceId]
      );
    }

    const [rows] = await promiseDb.query(
      `
        SELECT
          s.service_id,
          s.name,
          s.description,
          s.status,
          COALESCE((
            SELECT si.image_url
            FROM service_images si
            WHERE si.service_id = s.service_id
            ORDER BY si.id DESC
            LIMIT 1
          ), s.image) AS image_url
        FROM services s
        WHERE s.service_id = ?
        LIMIT 1
      `,
      [serviceId]
    );

    res.status(201).json({
      success: true,
      data: rows[0] ? mapServiceRow(rows[0]) : null
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status, image_url } = req.body;
    const serviceId = parseInt(id, 10);
    const promiseDb = db.promise();

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(normalizeStatus(status));
    }

    if (updates.length > 0) {
      params.push(serviceId);
      await promiseDb.query(
        `UPDATE services SET ${updates.join(', ')} WHERE service_id = ?`,
        params
      );
    }

    const uploadedImageUrl = req.file
      ? `/uploads/services/${req.file.filename}`
      : undefined;
    const nextImageUrl = uploadedImageUrl || image_url;

    if (nextImageUrl) {
      await promiseDb.query(
        'UPDATE services SET image = ? WHERE service_id = ?',
        [nextImageUrl, serviceId]
      );
      await promiseDb.query(
        'INSERT INTO service_images (image_url, service_id) VALUES (?, ?)',
        [nextImageUrl, serviceId]
      );
    }

    const [rows] = await promiseDb.query(
      `
        SELECT
          s.service_id,
          s.name,
          s.description,
          s.status,
          COALESCE((
            SELECT si.image_url
            FROM service_images si
            WHERE si.service_id = s.service_id
            ORDER BY si.id DESC
            LIMIT 1
          ), s.image) AS image_url
        FROM services s
        WHERE s.service_id = ?
        LIMIT 1
      `,
      [serviceId]
    );

    res.status(200).json({
      success: true,
      data: rows[0] ? mapServiceRow(rows[0]) : null
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);
    const promiseDb = db.promise();

    await promiseDb.query('DELETE FROM service_images WHERE service_id = ?', [serviceId]);
    await promiseDb.query('DELETE FROM services WHERE service_id = ?', [serviceId]);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this service because it is used by existing bookings'
      });
    }
    next(error);
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
