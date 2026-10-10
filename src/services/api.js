/**
 * CrisisGrid API Service
 * Centralized client for FastAPI backend integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Helper to handle fetch responses and errors uniformly
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }
  return await response.json();
}

/**
 * Health check endpoint
 * GET /health
 */
export async function checkBackend() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await handleResponse(response);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Backend server unreachable.');
    }
    throw err;
  }
}

/**
 * Upload research paper PDF for extraction
 * POST /extract
 * @param {File} file - PDF file to extract
 */
export async function uploadPaper(file) {
  if (!file) {
    throw new Error('Please select a PDF file.');
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Uploaded file must be a PDF document (.pdf).');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Note: Do not set Content-Type header manually; browser automatically sets multipart/form-data with boundary.
  const response = await fetch(`${API_BASE_URL}/extract`, {
    method: 'POST',
    body: formData,
  });

  return await handleResponse(response);
}

/**
 * Audit reported accuracy against measured accuracy
 * POST /audit
 * @param {number} reportedAccuracy - 0.0 to 1.0
 * @param {number} measuredAccuracy - 0.0 to 1.0
 */
export async function auditResults(reportedAccuracy, measuredAccuracy) {
  const reported = Number(reportedAccuracy);
  const measured = Number(measuredAccuracy);

  if (isNaN(reported) || isNaN(measured)) {
    throw new Error('Both reported and measured accuracy must be valid numbers.');
  }

  if (reported < 0 || reported > 1 || measured < 0 || measured > 1) {
    throw new Error('Accuracy values must be between 0.0 and 1.0 (e.g. 0.95 for 95%).');
  }

  const response = await fetch(`${API_BASE_URL}/audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      reported_accuracy: reported,
      measured_accuracy: measured,
    }),
  });

  return await handleResponse(response);
}

/**
 * Execute experiment runner
 * POST /run
 * Note: Backend currently returns HTTP 501 (Member 2 runner integration pending).
 */
export async function runExperiment(config = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(config),
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.status === 501) {
      return {
        status: 'not_implemented',
        available: false,
        message: 'Member 2 experiment runner not connected yet (HTTP 501).'
      };
    }
    throw err;
  }
}

export { API_BASE_URL };
