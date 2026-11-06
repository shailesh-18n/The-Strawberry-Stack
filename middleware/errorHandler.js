function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }
  const status = Number(error.statusCode || error.status);
  const isClientError = Number.isInteger(status) && status >= 400 && status < 500;
  const responseStatus = isClientError ? status : 500;
  const page = responseStatus === 400
    ? 'errors/400'
    : responseStatus === 403
      ? 'errors/403'
      : responseStatus === 413
        ? 'errors/413'
        : 'errors/500';

  if (!isClientError) {
    console.error('Unhandled request error.', error);
  }

  const errorTitle = responseStatus === 413
    ? 'Request too large'
    : responseStatus === 403
      ? 'Request rejected'
      : responseStatus === 400
        ? 'Invalid request'
        : 'Server error';
  return response.status(responseStatus).render(page, {
    title: errorTitle,
    user: null,
    csrfToken: '',
    currentYear: new Date().getFullYear(),
  });
}

module.exports = errorHandler;
