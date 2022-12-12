const request = require('request-promise-native');
// const { uuid } = require('uuidv4');
const { v4: uuidv4 } = require('uuid');

const token_type = "Bearer"


const ManagementClient = require('auth0').ManagementClient;
const client = new ManagementClient({
  domain: process.env.MANAGEMENT_DOMAIN,
  clientId: process.env.MANAGEMENT_CLIENT_ID,
  clientSecret:  process.env.MANAGEMENT_CLIENT_SECRET,
  scope: 'update:users',
});

const updateUserPassword = async(id, password) => {
  try {
    var response = await client.updateUser( { id }, { password })
      return true
  }
  catch(e) {
    // Should handle 400 Password is too weak etc
    return false           
  }
};

const updateUserProfile = async(id, userData) => {
  try {
    var response = await client.updateUserMetadata( { id }, userData )
      return true
  }
  catch(e) {
    // Should handle 400 Password is too weak etc
    return false           
  }
};

var getMgmtToken = async function() {
    const data = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/oauth/token`, {
      body: {
        "client_id": process.env.MANAGEMENT_CLIENT_ID,
        "client_secret": process.env.MANAGEMENT_CLIENT_SECRET,
        "audience": `https://${process.env.MANAGEMENT_DOMAIN}/api/v2/`,
        "grant_type": "client_credentials"
      },
      json: true,
    });
    var now = new Date();
    expiryDate = new Date(now.getTime() + data.expires_in*1000);
    return { access_token: data.access_token, expiryDate: expiryDate };
};

const registerUser = async(userData, authorizationCode) => {
  console.log("registering user - management.registerUser");
  var mgmt_token = await getMgmtToken();
  console.log("Got my MGT Token");
  try {
    const createResponse = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users`, {
      headers: {
        'Authorization': `${token_type} ${mgmt_token.access_token}`,
        'content-type': 'application/json'
      },
      body: {
        email: userData.email,
        email_verified: false,
        verify_email: false,
        password: userData.password,
        user_id: uuidv4(),
        name: userData.firstName + " " + userData.lastName,
        given_name: userData.firstName,
        family_name: userData.lastName,
        connection : process.env.AUTH0_DB_CONN_NAME,
        user_metadata : {
          "phone_number": userData.phoneNumber
        },
        app_metadata : { 
          selfreg : true,
        }
    },
    json : true
    });
    
    console.log(createResponse)
    return createResponse
  } catch(err) {
    console.log("****FAILURE ON REGISTRATION****")
    console.log(err.statusCode)
    console.log(err)
    return err
  }
};

const createUser = async(userData, authorizationCode, enrollToken) => {
  var mgmt_token = await getMgmtToken();
  try {
    const createResponse = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users`, {
      headers: {
        'Authorization': `${token_type} ${mgmt_token.access_token}`,
        'content-type': 'application/json'
      },
      body: {
        email: userData.accountNumber + "@sysgenemail.ignore",
        email_verified: false,
        verify_email: false,
        password: uuidv4(),
        name: userData.firstName + " " + userData.lastName,
        given_name: userData.firstName,
        family_name: userData.lastName,
        connection : process.env.AUTH0_DB_CONN_NAME,
        user_metadata : {
          "last_name": userData.lastName,
          "first_name": userData.firstName,
          "phone_number": userData.phoneNumber
        },
      app_metadata : { 
        enabled : false,
        step : "backend",
        accountNumber: userData.accountNumber,
        subsidiary: userData.subsidiary,
        bankCID: uuidv4(),
        authorizationCode: authorizationCode,
        enrollToken: enrollToken
      }
    },
    json : true
    });
    console.log("Creating user - management.createUser")
    console.log(createResponse)
    return createResponse
  } catch(err) {
    console.log("****FAILURE****")
    console.log(err.statusCode)
    console.log(err)
    return err
  }
};

const lookupUser = async (queryString) => {
  var mgmt_token = await getMgmtToken();
  try {
    const lookupResponse = await request.get(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users?q=${queryString}`, {
      headers: {
        'Authorization': `${token_type} ${mgmt_token.access_token}`,
        'content-type': 'application/json'
      },
      json : true
    });

    console.log(lookupResponse)
    return lookupResponse
  } catch(err) {
    return err
  };
};

const updateUser = async (userId, email, password) => {
  var mgmt_token = await getMgmtToken();
  try {
    const update1 = await request.patch(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users/${userId}`, {
    headers: {
      'Authorization': `${token_type} ${mgmt_token.access_token}`,
      'content-type': 'application/json'
    },
    body: {
      email: email,
      name: email,
      app_metadata : { 
        enabled : true,
        step : "signedUp"
      }
    },
    json : true
    });
    console.log("Update email");
    console.log(update1);

    const update2 = await request.patch(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users/${userId}`, {
      headers: {
        'Authorization': `${token_type} ${mgmt_token.access_token}`,
        'content-type': 'application/json'
      },
      body: {
        password: password
      },
      json : true
    });
    console.log("Update password");
    console.log(update2);

    const update3 = await request.patch(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/users/${userId}`, {
      headers: {
        'Authorization': `${token_type} ${mgmt_token.access_token}`,
        'content-type': 'application/json'
      },
      body: {
        nickname: email.split("@")[0]
      },
      json : true
    });
    console.log("Update nickname");
    console.log(update3);
  } catch(err) {
    return false;
  };
};

const getEnrollmentTicket = async (userId, factor) => {
  var mgmt_token = await getMgmtToken();
  const factorEnrollmentTicket = await request.post(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/guardian/enrollments/ticket`, {
    headers: {
      'Authorization': `${token_type} ${mgmt_token.access_token}`,
      'content-type': 'application/json'
    },
    body: {
      "user_id": `${userId}`,
      "send_mail": false,
      "allow_multiple_enrollments": true,
      "factor": `${factor}`
    },
    json : true
  });
  return factorEnrollmentTicket
};

const getMfaFactors = async () => {
  var mgmt_token = await getMgmtToken();
  try {
    const mfaFactors = (await request.get(`https://${process.env.MANAGEMENT_DOMAIN}/api/v2/guardian/factors`, {
      headers: {
        Authorization: `Bearer ${mgmt_token.access_token}`,
      },
      json: true,
    })).filter(x => x.enabled == true);
    console.log(mfaFactors)
    return mfaFactors;
  } catch (err) {
    console.log(err);
  };
};

module.exports = {
  updateUserPassword,
  updateUserProfile,
  registerUser,
  createUser,
  lookupUser,
  updateUser,
  getEnrollmentTicket,
  getMfaFactors
};
