@description('Location for all resources')
param location string = resourceGroup().location

@description('Name of the Azure AI Services multi-service resource')
param aiServicesName string = 'voltedge-ai'

// Multi-service Azure AI resource (covers OpenAI, Speech, Document Intelligence, Content Safety)
resource aiServices 'Microsoft.CognitiveServices/accounts@2024-10-01-preview' = {
  name: aiServicesName
  location: location
  sku: {
    name: 'S0'
  }
  kind: 'AIServices'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    allowProjectName: false
    dynamicThrottlingEnabled: true
    apiProperties: {
      apiAnalyticsEnabled: true
    }
  }
}

// Azure AI Search service for product catalog search (full-text + vector)
@description('Name of the Azure AI Search service')
param searchServiceName string = 'voltedge-search'

resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: searchServiceName
  location: location
  sku: {
    name: 'basic'  # basic tier supports vector search
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
    publicNetworkAccess: 'enabled'
  }
}

output aiServicesEndpoint string = aiServices.properties.endpoint
output searchServiceEndpoint string = 'https://${searchServiceName}.search.windows.net'
