@description('Location for all resources')
param location string = resourceGroup().location

@description('Resource group containing the AKS cluster and this App Insights resource')
param resourceGroupName string = resourceGroup().name

@description('Name for the Application Insights component')
param appInsightsName string = 'voltedge-web'

// Log Analytics Workspace (required for workspace-based App Insights)
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${appInsightsName}-law'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights component (workspace-based)
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

output connectionString string = applicationInsights.properties.ConnectionString
output instrumentationKey string = applicationInsights.properties.InstrumentationKey
