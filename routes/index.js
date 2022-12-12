var router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
const request = require('request-promise-native');
var managementClient = require('../services/management');

router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Auth0 Webapp sample Nodejs',
    isAuthenticated: req.oidc.isAuthenticated()
  });
});

router.get('/profile', requiresAuth(), async function (req, res, next) {
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;
  console.log(req.oidc.accessToken)
  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {
    const userInfo = await req.oidc.fetchUserInfo();
    console.log(userInfo)
    res.render('profile', {
      userProfile: JSON.stringify(req.oidc.user, null, 2),
      userData: userInfo,
      title: 'Profile page'
    });
  } catch (err) {
    console.log(err);
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});

router.get('/authenticators', requiresAuth(), async function (req, res, next) {
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;
  console.log(req.oidc.accessToken)
  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }  try {
    const authenticators = (await request.get(`${process.env.AUDIENCE}authenticators`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      json: true,
    })).filter(x => x.active == true);
    console.log(authenticators);

    const oobAuth0 = authenticators.filter(p => (p.authenticator_type === "oob" && p.oob_channel === "auth0")).length > 0;
  
    const mfaFactors = await managementClient.getMfaFactors();

    var enrollables = mfaFactors.map(a => a.name);
    enrollables[enrollables.length] = "oob-Auth0";

/*
    const enrollables = [
      'sms',
      'push-notification',
      'otp',
      'email',
      'webauthn-roaming',
      'webauthn-platform',
      'oob-Auth0'
    ]
*/
    res.render('authenticators', {
      authenticators: authenticators,
      mfaFactors: mfaFactors,
      title: 'Authenticators',
      enrollables: enrollables
    });
  } catch (err) {
    console.log(err);
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});

router.get('/delete/:id', requiresAuth(), async function (req, res, next) {

  const id = req.params.id;
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {
    var deleteResponse = {};
    deleteResponse = await request.delete(`${process.env.AUDIENCE}authenticators/${id}`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      json: true,
    });
    console.log(deleteResponse);
    res.redirect("/authenticators");
  }
  catch (err) {
    //console.log(err);

    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});

module.exports = router
