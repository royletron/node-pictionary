
/*
 * GET home page.
 */
function isLogged(req){
  return req.user != undefined
}
exports.index = function(req, res){
  res.render('index', { title: 'Express', logged: isLogged(req)});
};

exports.draw = function(req, res){
  res.render('draw', { title: 'Express' });
};

exports.success = function(req, res){
  req.flash('success', 'Yo '+req.user.username+' you is now logged in!');
  res.render('home', { logged: isLogged(req), user: req.user });
};

exports.fails = function(req, res){
  req.flash('fail', 'Yo, not sure what you did, but you need to log in using a Twitter account!');
  res.render('index', { logged: isLogged(req) });
};

exports.logout = function(req, res){
  req.flash('info', 'Your loss, guess you have a life or something');
  req.logout();
  res.render('index', { logged: isLogged(req) });
}