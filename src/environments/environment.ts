export const environment = {
  production: false,
  apiUrl: 'https://gosl.equilearn.in/api',
  enableConsoleLogs: true,
  enableDebugMode: true,
  sessionTimeout: 30, // minutes
  warningTime: 5, // minutes before session expires to show warning
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.pdf', '.doc', '.docx'],
  retryAttempts: 3,
  timeoutDuration: 30000, // 30 seconds
  enableErrorTracking: true,
  enablePerformanceMonitoring: true,
  enableAnalytics: false,
  version: '1.0.0'
}; 