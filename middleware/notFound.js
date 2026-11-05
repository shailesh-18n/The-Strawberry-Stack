function notFound(_request, response) {
  response.status(404).render('errors/404', {
    pageTitle: 'Page not found',
  });
}

module.exports = notFound;
