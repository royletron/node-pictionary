
/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.user = function(req, res){
  console.log(req);
  res.render('user', { user: req.user });
};