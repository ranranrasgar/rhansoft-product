import { ApplicationInsights } from "@microsoft/applicationinsights-web"

// Initialize Application Insights only when a connection string is provided
// via environment variable (set at build/deploy time). In local dev without a
// connection string, this is a no-op so the app still works.
const connectionString =
  (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING as string | undefined) ?? ""

let appInsights: ApplicationInsights | null = null

if (connectionString && typeof window !== "undefined") {
  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: true,
      enableAjaxErrorStatusText: true,
      autoExceptionInstrumented: true,
      autoUnhandledPromiseInstrumented: true,
    },
  })
  appInsights.loadAppInsights()
  appInsights.trackPageView()
}

export { appInsights }
