
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export const initDatadog = () => {
  // @ts-ignore
  const env = import.meta.env || {};

  const appId = env.VITE_DD_APPLICATION_ID;
  const clientToken = env.VITE_DD_CLIENT_TOKEN;
  const site = env.VITE_DD_SITE || 'datadoghq.com';
  const service = env.VITE_DD_SERVICE || 'zysculpt';
  const environment = env.VITE_DD_ENV || 'development';

  if (appId && clientToken) {
    try {
      // Initialize Real User Monitoring (RUM)
      datadogRum.init({
        applicationId: appId,
        clientToken: clientToken,
        site: site,
        service: service,
        env: environment,
        version: '1.0.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20, // Record 20% of sessions for replay
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
      });
      
      datadogRum.startSessionReplayRecording();

      // Initialize Remote Logging
      datadogLogs.init({
        clientToken: clientToken,
        site: site,
        service: service,
        env: environment,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
      });

      console.log('Datadog RUM & Logs Initialized');
    } catch (error) {
      console.error('Failed to initialize Datadog', error);
    }
  } else {
    console.warn('Datadog credentials missing in environment variables (VITE_DD_APPLICATION_ID, VITE_DD_CLIENT_TOKEN). Monitoring disabled.');
  }
};

export const setDatadogUser = (user: { id: string; email?: string; name?: string }) => {
  if (datadogRum.getInternalContext()) {
    datadogRum.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    datadogLogs.setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
};

export const clearDatadogUser = () => {
  if (datadogRum.getInternalContext()) {
    datadogRum.removeUser();
    datadogLogs.removeUser();
  }
};

// --- SIMULATION TOOLS FOR OBERVABILITY TESTING ---

export const simulateError = () => {
  const error = new Error("SIMULATED_ERROR: Test Alert Triggered from Settings");
  datadogLogs.logger.error("Test Error for Monitor Verification", {
    error: error.message,
    stack: error.stack,
    service: 'zysculpt',
    status: 'error',
    alert_type: 'test_simulation'
  });
  alert("Simulated Error sent to Datadog Logs. Check your 'High Error Rate' monitor.");
};

export const simulateHighLatency = () => {
  const startTime = performance.now() - 15000; // Pretend it started 15 seconds ago
  const durationMs = 15000;
  
  datadogLogs.logger.info("LLM Chat Stream Success", {
    model: 'gemini-test-simulated',
    duration_ms: durationMs,
    status: 'ok',
    service: 'zysculpt',
    llm_telemetry: {
      tokens: { prompt: 100, completion: 100, total: 200 },
      latency: durationMs,
      estimated_cost_usd: 0.01
    },
    alert_type: 'test_simulation'
  });
  alert("Simulated 15s Latency log sent. Check your 'High Latency' monitor.");
};

export const simulateCostSpike = () => {
  datadogLogs.logger.info("LLM Career Plan Success", {
    model: 'gemini-3-pro-preview',
    duration_ms: 2000,
    status: 'ok',
    service: 'zysculpt',
    llm_telemetry: {
      tokens: { prompt: 50000, completion: 5000, total: 55000 },
      latency: 2000,
      estimated_cost_usd: 6.00 // Intentionally high to trigger >$5 alert
    },
    alert_type: 'test_simulation'
  });
  alert("Simulated $6.00 Cost Spike sent. Check your 'High Cost' monitor.");
};
