function notFound(_request, response) {
  response.status(404).render('errors/404', {
    title: 'Page not found',
    user: null,
    csrfToken: '',
    currentYear: new Date().getFullYear(),
  });
}

module.exports = notFound;
