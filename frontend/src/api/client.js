import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('genomeai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        response: {
          data: {
            detail: {
              message: 'Request timed out. Please try again.',
            },
          },
        },
      });
    }

    if (!error.response) {
      return Promise.reject({
        response: {
          data: {
            detail: {
              message:
                'Unable to connect to the GenomeAI server. Please ensure the backend is running.',
            },
          },
        },
      });
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Health
// ============================================================

export async function fetchHealth() {
  const { data } = await client.get('/health');
  return data;
}

// ============================================================
// Prediction
// ============================================================

export async function predictSequence(sequence, { model = 'cnn', explain = false } = {}) {
  const cleanedSequence = String(sequence)
    .replace(/\s+/g, '')
    .toUpperCase();

  const { data } = await client.post(`/predict?model=${model}&explain=${explain}`, {
    sequence: cleanedSequence,
  });

  return data;
}

export async function predictSequenceExtended(sequence, { model = 'cnn' } = {}) {
  const cleanedSequence = String(sequence)
    .replace(/\s+/g, '')
    .toUpperCase();

  const { data } = await client.post(`/predict/extended?model=${model}`, {
    sequence: cleanedSequence,
  });

  return data;
}

export async function runBlastSearch(sequence) {
  const cleanedSequence = String(sequence)
    .replace(/\s+/g, '')
    .toUpperCase();

  const { data } = await client.post('/predict/blast', {
    sequence: cleanedSequence,
  });

  return data;
}

// ============================================================
// Report
// ============================================================

export async function downloadPredictionReport(sequence, { model = 'cnn', patientName = '' } = {}) {
  const cleanedSequence = String(sequence)
    .replace(/\s+/g, '')
    .toUpperCase();

  const params = new URLSearchParams({ model });
  if (patientName) params.set('patient_name', patientName);

  const { data } = await client.post(
    `/predict/report?${params.toString()}`,
    { sequence: cleanedSequence },
    { responseType: 'blob' }
  );

  return data;
}

// ============================================================
// Benchmark
// ============================================================

export async function fetchBenchmark(model = 'all') {
  const { data } = await client.get(`/benchmark?model=${model}`);
  return data;
}

export async function refreshBenchmark() {
  const { data } = await client.post('/benchmark/refresh');
  return data;
}

// ============================================================
// Analytics
// ============================================================

export async function fetchAnalytics() {
  const { data } = await client.get('/analytics');
  return data;
}

// ============================================================
// History
// ============================================================

export async function fetchHistory({
  limit = 50,
  offset = 0,
  search,
  model,
  disease,
} = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (search) params.set('search', search);
  if (model) params.set('model', model);
  if (disease) params.set('disease', disease);

  const { data } = await client.get(`/history?${params.toString()}`);
  return data;
}

export async function deleteHistoryRecord(id) {
  const { data } = await client.delete(`/history/${id}`);
  return data;
}

export async function clearAllHistory() {
  const { data } = await client.delete('/history');
  return data;
}

// ============================================================
// Admin
// ============================================================

export async function fetchAdminStats() {
  const { data } = await client.get('/admin/stats');
  return data;
}

// ============================================================
// Auth & LIS Management API
// ============================================================

export async function loginUser(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  if (data.access_token) {
    localStorage.setItem('genomeai_token', data.access_token);
  }
  return data;
}

export async function registerLaboratory(registerData) {
  const { data } = await client.post('/auth/register-lab', registerData);
  if (data.access_token) {
    localStorage.setItem('genomeai_token', data.access_token);
  }
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await client.get('/auth/me');
  return data;
}

export async function changePassword(oldPassword, newPassword) {
  const { data } = await client.post('/auth/change-password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return data;
}

export async function fetchLabUsers() {
  const { data } = await client.get('/lis/users');
  return data;
}

export async function createLabUser(userData) {
  const { data } = await client.post('/lis/users', userData);
  return data;
}

export async function deleteLabUser(userId) {
  const { data } = await client.delete(`/lis/users/${userId}`);
  return data;
}

export async function fetchLabDetails() {
  const { data } = await client.get('/lis/lab');
  return data;
}

export async function fetchModelMetrics() {
  const { data } = await client.get('/model/metrics');
  return data;
}

export function logoutUser() {
  localStorage.removeItem('genomeai_token');
}

export default client;

