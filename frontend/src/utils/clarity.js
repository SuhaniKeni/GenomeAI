/**
 * Microsoft Clarity Analytics Integration Module for GenomeAI
 * 
 * Provides conditional, non-blocking telemetry initialization for
 * Production builds while preserving privacy during local localhost development.
 */
import Clarity from '@microsoft/clarity';

let isInitialized = false;

/**
 * Initializes Microsoft Clarity tracking session if conditions are met.
 * 
 * Rules:
 * 1. Must have a valid VITE_CLARITY_PROJECT_ID configured in frontend/.env
 * 2. Only initializes during Production deployment
 * 3. Skips initialization during normal local localhost development
 * 4. Ensures single initialization instance
 * 5. Uses deferred execution (requestIdleCallback / setTimeout) so startup is never delayed
 */
export function initClarity() {
  // Prevent duplicate initialization
  if (isInitialized) {
    return;
  }

  const projectId = import.meta.env.VITE_CLARITY_PROJECT_ID;

  // Validate Project ID presence
  if (!projectId || projectId === 'YOUR_PROJECT_ID' || projectId.trim() === '') {
    console.log('[Clarity Telemetry] Skipping: VITE_CLARITY_PROJECT_ID is not configured in frontend/.env');
    return;
  }

  // Environment checks
  const isProd = import.meta.env.PROD;
  const hostname = window.location.hostname || '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';

  // Rule: Only initialize during Production deployment. Skip normal localhost dev.
  const shouldInitialize = isProd || (!isLocalhost && projectId !== 'YOUR_PROJECT_ID');

  if (!shouldInitialize) {
    console.log('[Clarity Telemetry] Disabled during local localhost development mode.');
    return;
  }

  // Non-blocking deferred initialization
  const deferInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));

  deferInit(() => {
    try {
      Clarity.init(projectId);
      isInitialized = true;
      console.log(`[Clarity Telemetry] Microsoft Clarity initialized successfully (Project ID: ${projectId})`);
    } catch (err) {
      console.warn('[Clarity Telemetry] Failed to initialize Microsoft Clarity:', err);
    }
  });
}
