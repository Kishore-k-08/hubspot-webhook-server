export function logRequest(body, startTime) {
  const timestamp = new Date().toISOString();
  console.log(`\n📥 [${timestamp}] POST /webhook`);
  console.log('🔍 Request Body:', JSON.stringify(body, null, 2));
}
