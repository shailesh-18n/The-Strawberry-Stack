function showHome(request, response) {
  response.render('home', {
    title: 'VidyaChain',
    user: request.session.userId ? { id: request.session.userId } : null,
  });
}

module.exports = { showHome };
