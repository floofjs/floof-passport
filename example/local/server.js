const {Floof, FloofBall, Floop, redirect} = require('floof');
const passport = require('passport');
const {Strategy} = require('passport-local');
const SessionPlugin = require('floof-session');
const PassportPlugin = require('../../index.js')
const db = require('./users.js');

const userSer = {
  serialize(user) {
    return user.id;
  },
  async deserialize(id) {
    return await db.lookup(id);
  },
};

const app = new FloofBall();
app.plugin(new SessionPlugin('SuperSecretKey'));
app.plugin(new PassportPlugin(true, userSer)
  .use(new Strategy((un, pass, cb) => {
    db.lookupUsername(un).then(user => {
      if (!user || user.password !== pass) cb(null, false);
      cb(null, user);
    });
  })));

app.before().exec(req => {
  if (req.session.flashes) {
    req.flashes = req.session.flashes;
    req.session.flashes = [];
  } else {
    req.flashes = req.session.flashes = [];
  }
  req.flash = function(s) {
    req.session.flashes.push(s);
  }
});

app.get('/').exec((req, ren) => ren.render('home.html'));

app.get('/profile').exec((req, ren) => {
  if (!req.user) return redirect('/login');
  return ren.render('profile.html');
});

app.get('/login').exec((req, ren) => {
  if (req.user) return redirect('/')
  return ren.render('login.html');
});

app.post('/login').withBody('form').exec(async (req, ren) => {
  req.backing.body = await req.body();
  const result = await req.authenticate('local');
  if (result.status === 'success') return redirect('/');
  if (result.status === 'fail') {
    if (result.failure.challenge) {
      req.flash(result.failure.challenge.message);
    } else {
      req.flash('Invalid credentials');
    }
    return redirect('/login');
  }
  console.log(result);
  throw new Floop(500);
});

app.get('/logout').exec((req, ren) => {
  req.logout();
  return redirect('/');
});

const server = new Floof().ball(app);
server.go().then(() => console.log('Server started.'));