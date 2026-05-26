// Wraps an async Express handler so any rejected promise is forwarded to
// `next(err)` instead of being silently swallowed. Without this, every
// controller would need its own try/catch boilerplate.
//
//   router.get('/orders/:id', asyncHandler(async (req, res) => { ... }));

/** @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<unknown>} fn */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
