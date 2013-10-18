
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.draw = function(req, res){
  res.render('draw', { title: 'Express' });
};