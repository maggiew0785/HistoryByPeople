const { RateLimitError } = require('@runwayml/sdk');

// Test error detection logic
function testRateLimitDetection(error) {
  const isRateLimit = error instanceof RateLimitError ||
                     error.status === 429 ||
                     (error.error && 
                      typeof error.error === 'object' && 
                      error.error.error && 
                      error.error.error.toLowerCase().includes('daily task limit'));
  
  console.log('Error detection result:', isRateLimit);
  console.log('Error type:', error.constructor.name);
  console.log('instanceof RateLimitError:', error instanceof RateLimitError);
  console.log('Status:', error.status);
  console.log('Error.error.error:', error.error?.error);
}

// Simulate the exact error structure from your logs
const mockError = new RateLimitError(
  429,
  {
    error: 'Your daily task limit has been reached.',
    docUrl: 'https://docs.dev.runwayml.com/api'
  },
  '429 {"error":"Your daily task limit has been reached.","docUrl":"https://docs.dev.runwayml.com/api"}',
  {
    'apigw-requestid': 'NqVKai2eoAMEMeA=',
    connection: 'keep-alive',
    'content-length': '96',
    'content-type': 'application/json; charset=utf-8'
  }
);

console.log('Testing rate limit detection with mock error:');
testRateLimitDetection(mockError);
