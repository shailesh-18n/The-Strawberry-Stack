function showHome(_request, response) {
  response.render('foundation', {
    pageTitle: 'VidyaChain',
  });
}

module.exports = { showHome };
