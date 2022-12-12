var router = require('express').Router();
var managementClient = require('../services/management');
const { uuid } = require('uuidv4');
const request = require('request-promise-native');

// Initial signup page
// Renders form for user "lookup" and additional starting info
router.get('/register', async function (req, res, next) {
    try {
      res.render('user-register', {
        title: 'Register'
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

// Calls the function for creation of the user with ? User_ID
router.post('/register', async function (req, res, next) {
  const authorizationCode = uuid();
  const userData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password
  }
  var userCreateRes = await managementClient.registerUser(userData, authorizationCode);
  // const enrollSMS = await managementClient.getEnrollmentTicket(req.body.id, "phone")
  // const enrollPush = await managementClient.getEnrollmentTicket(req.body.id, "push-notification")
  // const enrollWebAuthn = await managementClient.getEnrollmentTicket(req.body.id, "webauthn-platform")
  // console.log(enrollSMS)
  // res.render('register-mfa', {
  //   urlSMS: enrollSMS.ticket_url,
  //   urlPush: enrollPush.ticket_url,
  //   urlWebAuthn: enrollWebAuthn.ticket_url
  // })

  if (!userCreateRes.statusCode) {
    res.render('index');
  } else {
    res.render('error', {
      message: userCreateRes.message,
      error: process.env.NODE_ENV !== 'production' ? userCreateRes : {}
    });
  }
});

  
// Calls the function for creation of the user with temporary info
// After renders the auth and enroll codes
// router.post('/register', async function (req, res, next) {
//   const authorizationCode = uuid();
//   const userData = {
//     firstName: req.body.firstName,
//     lastName: req.body.lastName,
//     email: req.body.email,
//     phoneNumber: req.body.phoneNumber
//   }
//   var userCreateRes = await managementClient.registerUser(userData, authorizationCode);
//   if (!userCreateRes.statusCode) {
//     res.render('user-register-mfa', {
//       authorizationCode: authorizationCode
//     });
//   } else {
//     res.render('error', {
//       message: userCreateRes.message,
//       error: process.env.NODE_ENV !== 'production' ? userCreateRes : {}
//     });
//   }
// });

// Renders page for checking auth/enroll codes to allow for registration
// Retrieves enrollment tokens for MFA
// Renders registration page for MFA
router.post('/register-lookup', async function (req, res, next) {
  try {
      res.render('user-register-lookup', {
        title: 'Enter the enrollment token that was mailed to you to continue',
        authorizationCode: req.body.authorizationCode
      });
    } catch (err) {
      console.log(err);
      res.render('error', {
        message: err.message,
        error: process.env.NODE_ENV !== 'production' ? err : {}
      });
    }
  });

// Calls function for finding the temporary user via auth/enroll codes
// Renders final registration page for username, email, etc.
router.post('/register-user', async function (req, res, next) {
  try {
    const authorizationCode = req.body.authorizationCode;
    const enrollToken = req.body.enrollToken;
    const q = encodeURIComponent(`app_metadata.authorizationCode:"${authorizationCode}" AND app_metadata.enrollToken:"${enrollToken}"`);
    var userFound = await managementClient.lookupUser(q)
    console.log(userFound);
    user = userFound[0]
    res.render('user-register-complete', {
        user_id : user.user_id
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
  
// Calls function(s) to update the user based on final registration info
// WAS PREVIOUSLY /register
  router.post('/register-sms', async function (req, res, next) {
    //console.log(req.body);
    const userUpdated = await managementClient.updateUser(req.body.id, req.body.email, req.body.password)
    //console.log(userUpdated);
    const enrollSMS = await managementClient.getEnrollmentTicket(req.body.id, "phone")
    const enrollPush = await managementClient.getEnrollmentTicket(req.body.id, "push-notification")
    const enrollWebAuthn = await managementClient.getEnrollmentTicket(req.body.id, "webauthn-platform")
    //console.log(enrollSMS)
    res.render('register-mfa', {
      urlSMS: enrollSMS.ticket_url,
      urlPush: enrollPush.ticket_url,
      urlWebAuthn: enrollWebAuthn.ticket_url
    })
  });
  
module.exports = router;
