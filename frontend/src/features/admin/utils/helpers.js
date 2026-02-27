export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
};

export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

export const sortByDate = (array, dateKey, ascending = true) => {
  return array.sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const filterByDateRange = (array, dateKey, startDate, endDate) => {
  return array.filter(item => {
    const itemDate = new Date(item[dateKey]);
    return itemDate >= startDate && itemDate <= endDate;
  });
};

export const aggregateData = (array, valueKey, groupKey) => {
  return array.reduce((result, item) => {
    const group = item[groupKey];
    if (!result[group]) {
      result[group] = 0;
    }
    result[group] += item[valueKey];
    return result;
  }, {});
};

export const downloadCSV = (data, filename) => {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const convertToCSV = (data) => {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => Object.values(obj).join(','));
  return [headers, ...rows].join('\n');
};