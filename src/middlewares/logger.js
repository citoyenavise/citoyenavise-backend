/**
 * Middleware de logging simple
 * Enregistre chaque requête HTTP
 */

export function logger(req, res, next) {
  const start = Date.now();

  // Intercepter la méthode send pour capturer le statut
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();

    // Format: [timestamp] METHOD URL STATUS (duration ms)
    console.log(
      `[${timestamp}] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`
    );

    return originalSend.call(this, data);
  };

  next();
}
