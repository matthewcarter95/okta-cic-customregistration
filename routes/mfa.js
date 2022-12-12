var router = require('express').Router();
const request = require('request-promise-native');
const { auth, requiresAuth } = require('express-openid-connect');


router.get('/otp/:action/', requiresAuth(), async function (req, res, next) {

  const action = req.params.action;
  console.log(req.params);
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {
    var otpResponse = {};
    otpResponse = await request.post(`${process.env.AUDIENCE}associate`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      body: {
        "authenticator_types": ["otp"]
      },
      json: true,
    });
    res.render('otp', {
      title: 'Enroll OTP',
      otpResponse: JSON.stringify(otpResponse, null, 2)
    });

  }
  catch (err) {
    console.log(err);
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});


router.post('/otp', requiresAuth(), async function (req, res, next) {

  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  //console.log(req.body);
  try {
    const otpEnrollResponse = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/oauth/token`, {
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: {
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-otp',
        client_id: process.env.CLIENT_ID,
        mfa_token: access_token,
        client_secret: process.env.CLIENT_SECRET,
        otp: req.body.otp
      }
    });

    //console.log(otpEnrollResponse);

    res.redirect("/authenticators");
  }
  catch (err) {
    console.log(err);
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});


router.get('/push/:type', requiresAuth(), async function (req, res, next) {

  const type = req.params.type;
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {
    var oobEnrollResponse = {};
    if (type === "enroll") oobEnrollResponse = await request.post(`${process.env.AUDIENCE}associate`, {
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
      body: {
        "authenticator_types": ["oob"],
        "oob_channels": ["auth0"]
      },
      json: true,
    });

    res.render('push', {
      title: 'Enroll Push Response',
      oobEnrollResponse: JSON.stringify(oobEnrollResponse, null, 2)
    });
  }
  catch (err) {
    console.log(err);

    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});

router.post('/push', requiresAuth(), async function (req, res, next) {

  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  console.log(JSON.parse(req.body.oobEnrollResponse));
  try {
    const oobEnrollResponse = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/oauth/token`, {
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: {
        grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
        client_id: process.env.CLIENT_ID,
        mfa_token: access_token,
        client_secret: process.env.CLIENT_SECRET,
        oob_code: JSON.parse(req.body.oobEnrollResponse).oob_code
      }
    });

    console.log(oobEnrollResponse);

    res.redirect("/authenticators");
  }
  catch (err) {
    console.log(err)
    if (err.error === "authorization_pending") {
      res.render('push', {
        title: 'Enroll Push Response',
        oobEnrollResponse: JSON.stringify(oobEnrollResponse, null, 2)
      });
    }
    else {
      res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV !== 'production' ? err : {}
      });
    }
  }
});


router.get('/phone/:type/:action', requiresAuth(), async function (req, res, next) {

  const action = req.params.action;
  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  var type = [req.params.type];
  console.log(type);

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {
    var phoneEnrollResponse = {};

    if (action === "enroll") {
        res.render('phone1', {
            title: 'Enroll Phone Number'
        });
      };

    if (action === "response") {
        phoneEnrollResponse = await request.post(`${process.env.AUDIENCE}associate`, {
            headers: {
                Authorization: `${token_type} ${access_token}`,
            },
            body: {
                "authenticator_types": ["oob"],
                "oob_channels": type,
                "phone_number": "+1"+req.body.phone
            },
            json: true,
        });
        res.render('phone', {
            title: 'Enroll Phone Response',
            phoneEnrollResponse: JSON.stringify(phoneEnrollResponse, null, 2)
        });
    };

  }
  catch (err) {
    console.log(err);

    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});

router.post('/phone/:type/:action', requiresAuth(), async function (req, res, next) {

    const action = req.params.action;
    let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;
  
    var type = [req.params.type];
    console.log(type);
  
    if (isExpired()) {
      res.redirect('/logout');
      //({ access_token } = await refresh());
    }
    try {
      var phoneEnrollResponse = {};
  
      if (action === "enroll") {
          res.render('phone1', {
              title: 'Enroll Phone Number'
          });
        };
  
      if (action === "response") {
          phoneEnrollResponse = await request.post(`${process.env.AUDIENCE}associate`, {
              headers: {
                  Authorization: `${token_type} ${access_token}`,
              },
              body: {
                  "authenticator_types": ["oob"],
                  "oob_channels": type,
                  "phone_number": "+1"+req.body.phone
              },
              json: true,
          });
          res.render('phone', {
              title: 'Enroll Phone Response',
              phoneEnrollResponse: JSON.stringify(phoneEnrollResponse, null, 2)
          });
      };
  
    }
    catch (err) {
      console.log(err);
  
      res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV !== 'production' ? err : {}
      });
    }
  });

  
router.post('/phone', requiresAuth(), async function (req, res, next) {

  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  console.log(JSON.parse(req.body.phoneEnrollResponse));
  console.log(req.body.code);
  var form = {
    grant_type: 'http://auth0.com/oauth/grant-type/mfa-oob',
    client_id: process.env.CLIENT_ID,
    mfa_token: access_token,
    client_secret: process.env.CLIENT_SECRET,
    oob_code: JSON.parse(req.body.phoneEnrollResponse).oob_code,
    binding_code: req.body.code
  };
  console.log(form);
  try {
    const oobEnrollResponse = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/oauth/token`, {
      headers: {
        'Authorization': `${token_type} ${access_token}`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      form: form
    });

    console.log(oobEnrollResponse);

    res.redirect("/authenticators");
  }
  catch (err) {
    console.log(err);
    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });

  }
});


router.get('/recoveryCode', requiresAuth(), async function (req, res, next) {

  let { token_type, access_token, isExpired, refresh } = req.oidc.accessToken;

  console.log(req.oidc.user);


  if (isExpired()) {
    res.redirect('/logout');
    //({ access_token } = await refresh());
  }
  try {

    const response = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users/${req.oidc.user.sub}/recovery-code-regeneration`, {
      headers: {
        Authorization: `Bearer ${req.token.access_token}`,
      },
      json: true
    });

    console.log(response.recovery_code);

    res.render('recoveryCode', {
      title: 'New Recovery Code',
      recovery_code: response.recovery_code
    });
  }
  catch (err) {
    //console.log(err);

    res.render('error', {
      message: err.message,
      error: process.env.NODE_ENV !== 'production' ? err : {}
    });
  }
});


module.exports = router;
