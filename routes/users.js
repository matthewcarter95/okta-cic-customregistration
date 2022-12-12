var router = require('express').Router();
const { requiresAuth } = require('express-openid-connect');
var managementClient = require('../services/management');

router.post('/user/password', requiresAuth(), async function (req, res) {
    const id = req.oidc.user.sub;
    const password = req.body.password
    var passwordSuccessfullUpdated = await managementClient.updateUserPassword(id, password);
    if(passwordSuccessfullUpdated) {
        res.render('change-response', {
            title: 'Success!',
            changeTitle: 'Password updated',
            changeMessage: 'Your password has been updated. You can use it to log back in.',
            isAuthenticated: req.oidc.isAuthenticated()
          });
    }
    else {
        res.render('change-response', {
            title: 'Error!',
            changeTitle: 'Password update failed',
            changeMessage: 'There was en error updating your password. Please try again later.',
            isAuthenticated: req.oidc.isAuthenticated()
          });
    }
});

router.post('/user/update', requiresAuth(), async function (req, res) {
    const id = req.oidc.user.sub;
    const userMetaData = {
        first_name: req.body.firstName,
        last_name: req.body.lastName,
        phone_number: req.body.phoneNumber
    }
    console.log(userMetaData)
    var userUpdatedResult = await managementClient.updateUserProfile(id, userMetaData);
    if(userUpdatedResult) {
        res.render('change-response', {
            changeTitle: 'Profile updated',
            changeMessage: 'Your profile has been updated.',
            isAuthenticated: req.oidc.isAuthenticated()
          });
    }
    else {
        res.render('change-response', {
            title: 'Error!',
            changeTitle: 'Profile update failed',
            changeMessage: 'There was en error updating your profile. Please try again later.',
            isAuthenticated: req.oidc.isAuthenticated()
          });
    }
});

module.exports = router;
