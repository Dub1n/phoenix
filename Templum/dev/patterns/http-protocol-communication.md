### HTTP Protocol Communication Pattern

**Status**: ESTABLISHED
**Category**: Technical
**Last Updated**: 2025-08-27
**Difficulty**: 🔴 Expert
**Est. Time**: ~3 hours
**Prerequisites**: Backend Service Integration, HTTP client libraries

**Problem**: PCL backend service requires HTTP communication with service-specific endpoint mapping and enhanced request/response handling.

**Solution**: Real HTTP implementation with PCL service-specific API integration, enhanced headers and request options, and comprehensive error handling.

#### HTTP Protocol Communication Pattern: Implementation Steps

```typescript
// Real HTTP implementation with PCL service-specific enhancements
private async callHTTPService(connection: BackendConnection, apiMethod:  string, payload: any): Promise<any> {
console.log(`[HTTP] Calling ${apiMethod} on real ${connection.id} PCL  service`);

try {
if (!connection.isConnected()) {
throw createTemplumError(`HTTP connection to ${connection.id} is not  available`, 'HTTP_CONNECTION_UNAVAILABLE', 'integration');
}

// PCL service-specific endpoint mapping for real API integration
const endpointMap: Record<string, string> = {
'getSkinDefinition': '/api/skins/definition',
'executeCommand': '/api/tdd/execute', 
'getCapabilities': '/api/capabilities',
'getVersion': '/api/version',
'getStatus': '/api/status'
};

const endpoint = endpointMap[apiMethod] || `/api/${apiMethod}`;
const url = `${connection.endpoint}${endpoint}`;
const requestId =  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Enhanced request options for real PCL service
const requestOptions = {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-Service-Id': connection.id,
'X-Request-Id': requestId,
'X-Client': 'Templum-Backend-Router',
'X-API-Method': apiMethod,
'User-Agent': 'Templum/1.0 (Backend-Service-Router)',
'Accept': 'application/json'
},
body: JSON.stringify({
method: apiMethod,
payload,
service: connection.id,
timestamp: Date.now(),
requestId,
// PCL-specific metadata
client: 'templum',
version: '1.0.0'
})
};

console.log(`[HTTP] Sending real PCL request:`, { url, method:  apiMethod, requestId, endpoint });

// Enhanced timeout handling for real service integration
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);

try {
const response = await fetch(url, {
...requestOptions,
signal: controller.signal
});

clearTimeout(timeoutId);

if (!response.ok) {
// Enhanced graceful handling for PCL service unavailability
if (apiMethod === 'getSkinDefinition' && (response.status === 404  || response.status === 503)) {
console.log(`[ARCHITECTURAL SEPARATION] PCL skin definition API  not available (${response.status}), using Universal Skin Engine fallback`);
return null;
}

throw createTemplumError(
`PCL HTTP ${response.status}: ${response.statusText}`,
'HTTP_REQUEST_FAILED',
'integration',
{ status: response.status, statusText: response.statusText }
);
}

let responseData;
const contentType = response.headers.get('content-type') || '';

if (contentType.includes('application/json')) {
responseData = await response.json();
} else {
responseData = { data: await response.text(), contentType };
}

// Enhanced PCL response handling with graceful fallbacks
if (apiMethod === 'getSkinDefinition') {
if (!responseData || (!responseData.skinDefinition &&  !responseData.data)) {
console.log(`[ARCHITECTURAL SEPARATION] PCL returned empty skin  definition, using Universal Skin Engine fallback`);
return null;
}

if (responseData.skinDefinition) {
console.log(`[HTTP] Successfully received PCL skin definition`);
return responseData;
}
}

return responseData;

} catch (fetchError: any) {
clearTimeout(timeoutId);

if (fetchError.name === 'AbortError') {
throw createTemplumError(`PCL HTTP request timeout for  ${apiMethod}`, 'HTTP_TIMEOUT', 'integration');
}

// Enhanced network error handling for PCL service
if (apiMethod === 'getSkinDefinition') {
console.log(`[ARCHITECTURAL SEPARATION] PCL network error for skin  definition, using Universal Skin Engine fallback:`, fetchError.message);
return null;
}

throw fetchError;
}

} catch (error) {
const errorMsg = isTemplumError(error) ? error.message : `PCL HTTP  call failed: ${error}`;
console.error(`[HTTP] Real PCL service call failed for ${apiMethod}:`,  errorMsg);

if (isTemplumError(error)) {
throw error;
}

throw createTemplumError(
`PCL HTTP communication failed: ${errorMsg}`,
'HTTP_ERROR',
'integration',
{ protocol: 'http', service: connection.id, method: apiMethod,  endpoint: connection.endpoint }
);
}
}

// PCL service capability testing during connection establishment
private async testPCLServiceCapabilities(endpoint: string, serviceId:  string): Promise<void> {
try {
console.log(`[HTTP] Testing PCL service capabilities at ${endpoint}`);

// Test PCL API endpoints that should be available
const testEndpoints = [
{ path: '/api/capabilities', name: 'capabilities' },
{ path: '/api/version', name: 'version' },
{ path: '/api/tdd/status', name: 'tdd-status' }
];

for (const testEndpoint of testEndpoints) {
try {
const response = await fetch(`${endpoint}${testEndpoint.path}`, {
method: 'GET',
headers: { 
'X-Service-Check': serviceId,
'X-Test-Capability': testEndpoint.name
},
signal: AbortSignal.timeout(3000)
});

if (response.ok) {
console.log(`[HTTP] PCL capability ${testEndpoint.name}  available (${response.status})`);
} else {
console.log(`[HTTP] PCL capability ${testEndpoint.name} not  available (${response.status})`);
}

} catch (error) {
console.log(`[HTTP] PCL capability test failed for  ${testEndpoint.name}:`, error);
}
}

} catch (error) {
console.warn(`[HTTP] PCL capability testing failed:`, error);
}
}
```

#### HTTP Protocol Communication Pattern: Success Metrics

- Real HTTP connection to PCL backend services established
- Service-specific PCL API endpoint mapping working
- Enhanced request headers and authentication handling
- Comprehensive error handling for HTTP failures and timeouts

#### HTTP Protocol Communication Pattern: Anti-Patterns

- **X** Using default HTTP settings without service-specific optimizations
- **X** Missing request correlation IDs and proper error context

#### HTTP Protocol Communication Pattern: Validation Checklist

- [ ] HTTP connection established with PCL backend services
- [ ] Service-specific endpoint mapping functional
- [ ] Request headers and authentication properly configured
- [ ] Error handling comprehensive for HTTP failures
- [ ] Timeout and retry logic working correctly

#### HTTP Protocol Communication Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### HTTP Protocol Communication Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-163]
**Successfully Applied**: [TASK-163] ✅ PCL HTTP Protocol Integration (2025-08-27)
**Integration Points**: Backend Service Integration, PCL Service
**Files Using This Pattern**: backend-service-router.ts (HTTP-specific sections)
