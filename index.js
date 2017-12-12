const {redirect} = require('floof');

class PassportPlugin {
  constructor(session = false, serializeUser = null) {
    this.useSession = session;
    this.serializeUser = serializeUser;
    if (this.useSession && !this.serializeUser) {
      throw new Error('You must specify a user serialization scheme!');
    }
    this.strats = new Map();
    this._key = 'passport';
  }
  
  use(strat) {
    this.strats.set(strat.name, strat);
    return this;
  }
  
  init(floofball) {
    const self = this;
    floofball.before().exec(async function(req) {
      req.backing._passport = req.__passport = {
        instance: self,
      };
      req.backing.session = req.session;
      if (self.useSession && req.session && req.session[self._key]) {
        req.__passport.session = req.session[self._key];
        if (req.__passport.session.user) {
          const user = await self.serializeUser.deserialize(req.__passport.session.user);
          if (!user) {
            delete req.__passport.session.user;
          } else {
            req.user = user;
          }
        }
      }
      req.login = req.logIn = async function(user) {
        req.user = user;
        if (self.useSession) {
          const serUser = await self.serializeUser.serialize(user);
          if (!req.__passport.session) req.__passport.session = {};
          req.__passport.session.user = serUser;
          req.session[self._key] = req.__passport.session;
        }
      };
      req.logout = req.logOut = async function() {
        req.user = null;
        if (self.useSession) {
          delete req.__passport.session.user;
        }
      };
      req.authenticate = async function(name, opts) {
        if (!Array.isArray(name)) name = [name];
        const failures = [];
        return await (async function attempt(i = 0) {
          if (i >= name.length) {
            return {
              status: 'fail',
              failure: failures[0],
              failures,
            };
          }
          let strategy = self.strats.get(name[i]);
          if (!strategy) throw new Error(`Unknown authentication strategy ${name[i]}`);
          strategy = Object.create(strategy);
          const out = await new Promise(async (resolve, reject) => {
            strategy.success = async function(user, info = {}) {
              try {
                await req.login(user);
                resolve({status: 'success', user, info});
              } catch (e) {
                resolve({status: 'error', error: e});
              }
            };
            strategy.fail = function(challenge, status) {
              if (typeof challenge === 'number') {
                status = challenge;
                challenge = undefined;
              }
              failures.push({challenge, status});
              resolve(false);
            };
            strategy.redirect = function(url, status) {
              resolve({status: 'redirect', redirect: redirect(url, status || 302)});
            };
            strategy.pass = function() {
              resolve({status: 'pass'});
            };
            strategy.error = function(e) {
              resolve({status: 'error', error: e});
            };
            strategy.authenticate(req.backing, opts);
          });
          return out ? out : await attempt(i + 1);
        })();
      };
    });
  }
}

module.exports = PassportPlugin;
