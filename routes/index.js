
/*
 * GET home page.
 */
var randword = require('randword');
var db = require('../db');

function isLogged(req){
  return req.user != undefined
}
exports.index = function(req, res){
  res.render('index', { active: 'index', logged: isLogged(req)});
};

exports.draw = function(req, res){
  res.render('draw', { active: 'draw', logged: isLogged(req) });
};

exports.success = function(req, res){
  req.flash('success', 'Yo '+req.user.username+' you is now logged in!');
  res.render('home', { active: 'home', logged: isLogged(req), user: req.user });
};

exports.fails = function(req, res){
  req.flash('fail', 'Yo, not sure what you did, but you need to log in using a Twitter account!');
  res.render('index', { active: 'index', logged: isLogged(req) });
};

exports.logout = function(req, res){
  req.flash('info', 'Your loss, guess you have a life or something');
  req.logout();
  res.render('index', { active: 'index', logged: isLogged(req) });
}

exports.start = function(req, res){
  getWords(res, 'start', { active: 'start', logged: isLogged(req), user: req.user, words: [] });
}

function getWords(res, request, vars){
  console.log(vars);
  if(vars.words.length < 5)
  {
    randword(function(err, word) {
      db.Room.findOne({name: word}, function(err, currentRoom){
        if(!currentRoom){
          vars.words.push(word);
        }
        getWords(res, request, vars);
      });
    });
  }
  else{
    res.render(request, vars);
  }
}