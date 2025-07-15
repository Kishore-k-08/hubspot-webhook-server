export default (req, res, next) => {
    const start = Date.now();
    console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

    if (req.method === 'POST') {
        console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2));
    }

    const originalSend = res.send;
    res.send = function (body) {
        console.log(`📤 Response [${res.statusCode}] after ${Date.now() - start}ms:`, body);
        return originalSend.call(this, body);
    };

    next();
};
