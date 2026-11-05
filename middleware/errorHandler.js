function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }
  const status = Number(error.statusCode || error.status);
  const isClientError = Number.isInteger(status) && status >= 400 && status < 500;
  const responseStatus = isClientError ? status : 500;
  const page = responseStatus === 400 ? 'errors/400' : responseStatus === 413 ? 'errors/413' : 'errors/500';

  if (!isClientError) {
    console.error('Unhandled request error.', error);
  }

  return response.status(responseStatus).render(page, {
    pageTitle: responseStatus === 413 ? 'Request too large' : responseStatus === 400 ? 'Invalid request' : 'Server error',
  });
}

module.exports = errorHandler;
