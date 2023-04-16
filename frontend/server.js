var express = require('express');
var app = express();
var path = require('path');
const axios = require('axios');
const port = 8080;
const bodyParser  = require('body-parser');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const jwtDecode = require('jwt-decode');
const NodeCache = require('node-cache');
const myCache = new NodeCache();



const { response } = require('express');
const { request } = require('express');
const { userInfo } = require('os');

var selectedID = "";
app.use(bodyParser.urlencoded());

app.set("views", path.resolve(__dirname, "views"));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    res.render('pages/index.ejs')
})

// route saves the user token to MyCache part of NodeCache
// token is coming from cognito
// https://www.npmjs.com/package/node-cache
app.get('/startcustcache', function(req, res){
    const query = req.query;
    const data = JSON.parse(query.data);
    myCache.set('UserToken', data);
    res.redirect('/customerhome')
})

// route saves the Admin token to MyCache part of NodeCache
app.get('/startadmincache', function(req, res){
    const query = req.query;
    const data = JSON.parse(query.data);
    myCache.set('AdToken', data);
    res.redirect('/employeehome')
})

// route that gets the customers scheduled appointments
app.get('/customerhome', function(req, res) {
    // calls cache to 
    const userToken = myCache.get('UserToken');
    const id = userToken.id_token;
    const token = userToken.access_token;
    // fuction called that checks the customers access token and validates the user
    verifyToken(token)
        .then((response) => {
            if (response === null) {
                // if the payload is null, then cache will be cleared and user will be sent back to main page
                myCache.del('UserToken');
                res.redirect("/");
            } else {
                // decodes id_token to send to the backend
                var UserInfo = decodeIdToken(id)
                // once user is verified, call to check if user is in database, if they are not then they are added
                axios.get(`http://127.0.0.1:5000/api/checkAddUser`, {data: {userInfo: UserInfo}})
                .then((response)=>{
                    console.log(response.data)
                // get customer's appointments from api
                    axios.get(`http://127.0.0.1:5000/api/AppointmentsCustomer`, {data: {userInfo: UserInfo}})
                        .then((response) => {
                            var appointments = response.data;
                            var tagline = "Here is the data coming from my own API";
                            // render page of appointments
                            res.render('pages/customerindex.ejs', {
                                appointments: appointments,
                                tagline: tagline
                            });
                        });
                    })
                }   
            })
        .catch((error) => {
                console.log(error);
                res.status(500).send('Internal Server Error');
        });
    
});


// route to create an appointment for the customer
app.get('/customer_createappointment', (req, res) => {
    
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            // gets employee and services to dysplay as options to select in the webpage
            const employeesurl = 'http://127.0.0.1:5000/api/Employees';
            const servicesurl = 'http://127.0.0.1:5000/api/Services';
    
            const date = new Date();
            date.setDate(date.getDate() + 1);
            var year = date.toLocaleString("default", { year: "numeric" });
            var month = date.toLocaleString("default", { month: "2-digit" });
            var day = date.toLocaleString("default", { day: "2-digit" });
            var currDate = year + "-" + month + "-" + day;

            var nextDate = new Date(date.setMonth(date.getMonth() + 2));
            var year = nextDate.toLocaleString("default", { year: "numeric" });
            var month = nextDate.toLocaleString("default", { month: "2-digit" });
            var day = nextDate.toLocaleString("default", { day: "2-digit" });
            var maxDate = year + '-' + month + '-' + day;
    
            axios.get(employeesurl)
            .then((response)=>{
                var employees = response.data 

                axios.get(servicesurl)
                .then((response) =>{
                    var services = response.data    
        
                    res.render('pages/newappointment', {
                        employees: employees,
                        services: services,
                        currDate: currDate,
                        maxDate: maxDate
                    });
                });
            });
        }
    });
});
    

// add appointment info to database
// takes form values and formats to make backend request
app.post('/add_appointment', function(req, res){

    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    var UserInfo = decodeIdToken(userToken.id_token)
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            var olddate = req.body.date;
            var date = olddate.replace('-','/')
            date = date.replace('-','/')
    
            var time = req.body.time;
            time = time + ':00'

            var employeeid = req.body.employeeid;
    
            // split service id and price info
            var serviceinfo = req.body.serviceinfo;
    
            if (typeof serviceinfo == 'string') {
                serviceinfo = serviceinfo.split(" ");
                var serviceid = [];
                serviceid.push(serviceinfo[0]);
                var servicePrice = serviceinfo[1];
            } else {
                var serviceid = [];
                var servicePrice = 0;
                for (let x in serviceinfo) {
                    oneservice = serviceinfo[x].split(" ");
                    var service = oneservice[0];
                    var price = oneservice[1];
                    serviceid.push(service);
                    servicePrice += parseInt(price);
                }
                servicePrice = String(servicePrice)
            };
            var customerNote = req.body.comments;
    
            var appointmentinfo = {
                'appointment_date': date,
                'appointment_time': time,
                'employee_id' : employeeid,
                'service_id' : serviceid,
                'appointment_total': servicePrice,
                'customer_note' : customerNote
            }
            console.log(appointmentinfo)
    
            //send to backend api
            axios.get(`http://127.0.0.1:5000/api/findCustID/${UserInfo.email}`)
            .then((response)=>{
                customers = response.data;
                let id = customers[0].customer_id;
                axios.post(`http://127.0.0.1:5000/api/add/appointment/${id}`, appointmentinfo)
                .then(function (response) {
                    if ((response.data) === 'Appointment added successfully') {
                        res.render('pages/createsuccess.ejs')
                    }
                    else {
                        res.send('fail')
                    }
                });
            });
        }
    })
});

// route used to cancel a customer's appointment
app.get('/customer_cancelappointment', (req, res) => {
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    var UserInfo = decodeIdToken(userToken.id_token)
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            // gets the customer's scheduled appointments
            axios.get(`http://127.0.0.1:5000/api/CustCancelAppointment/${ UserInfo.email }`)
            .then((response)=>{
                var appointments = response.data;
                console.log(appointments)
                // render page of cancel appointments
                res.render('pages/cancelappointment.ejs', {
                    appointments: appointments,
                });
            });
        }
    });
});

// route to change customer preffered contact method (email/phone)
app.get('/customer_contactmethod', function(req,res) {
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    var UserInfo = decodeIdToken(userToken.id_token)
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            // gets the customer's current preffered contact method
            axios.get(`http://127.0.0.1:5000/api/CustContactMethod/${UserInfo.email}`)
            .then((response)=>{
                contactmethod = response.data;
                console.log(contactmethod)
                res.render('pages/contactmethod.ejs', {contactmethod: contactmethod});
            });
        }
    });
})

// used to dysplay that the customer succesfully created an appointment
app.get('/createsuccess', (req, res) => {
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            res.render('pages/createsuccess.ejs')
        }
    })
})

// route shows confirmation page that the appountment was canceled for the user that is logged in
app.get('/cancelsuccess', (req, res) => {
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            res.render('pages/cancelsuccess.ejs')
        }
    })
})

// route that shows a success message that the customer switched preffered contact method
app.get('/changecontactmethodsuccess', (req, res) => {
    const userToken = myCache.get('UserToken');
    const token = userToken.access_token;
    var UserInfo = decodeIdToken(userToken.id_token)
    verifyToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('UserToken');
            res.redirect("/");
        } else {
            res.render('pages/contactmethodsuccess.ejs')
        }
    })
})

// route shows reports for admin to see
app.get('/showreports', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    // verify admin token
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            // multiple api's called to show all reports
        const commonurl = 'http://127.0.0.1:5000/api/MostandLeastCommonService';
        const contacturl = 'http://127.0.0.1:5000/api/Contacttype'
        const earningsurl = 'http://127.0.0.1:5000/api/Earnings'
        const custearningsurl = 'http://127.0.0.1:5000/api/earningspercustomer'
        const busydayurl = 'http://127.0.0.1:5000/api/busiestdayofweek'
        const custcancelurl = 'http://127.0.0.1:5000/api/customersmostcancel'
        const numappointmentsurl = 'http://127.0.0.1:5000/api/numberofappointments'
        const employeeappointmenturl = 'http://127.0.0.1:5000/api/ScheduledAppointmentsPerEmployee'
        const profitableurl = 'http://127.0.0.1:5000/api/ServiceProfitability'

        axios.all([
            axios.get(commonurl),
            axios.get(contacturl),
            axios.get(earningsurl),
            axios.get(custearningsurl),
            axios.get(busydayurl),
            axios.get(custcancelurl),
            axios.get(numappointmentsurl),
            axios.get(employeeappointmenturl),
            axios.get(profitableurl)
        ]).then(axios.spread((
            response1,
            response2,
            response3,
            response4,
            response5,
            response6,
            response7,
            response8,
            response9
            ) => {
            var commonservicedata = response1.data;
            var contactdata = response2.data;
            var earningsdata = response3.data;
            var custearningsdata = response4.data;
            var busydaydata = response5.data;
            var custcanceldata = response6.data;
            var numappointmentsdata = response7.data;
            var employeeappointmentdata = response8.data;
            var profitabledata = response9.data;
            res.render('pages/reports.ejs', {
                commonservicedata: commonservicedata,
                contactdata: contactdata,
                earningsdata: earningsdata,
                custearningsdata: custearningsdata,
                busydaydata: busydaydata,
                custcanceldata: custcanceldata,
                numappointmentsdata: numappointmentsdata,
                employeeappointmentdata: employeeappointmentdata,
                profitabledata: profitabledata
            });
        }));
    }})
});

// route to add a new employee
app.post('/add_employee', function(req, res) {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            // formatting to send database request
            var employeeFirstName = req.body.employeefname;
            var employeeLastName = req.body.employeelname;
            var employeeStatus = req.body.employeestatus;

            var employeeinfo = {
                'employee_first_name': employeeFirstName,
                'employee_last_name': employeeLastName,
                'employee_status': employeeStatus,
                }
            // adds employee to database
            axios.post('http://127.0.0.1:5000/api/add/employee', employeeinfo)
            .then(function (response) {
                if ((response.data) === 'Employee added successfully') {
                    res.render('pages/employeesucess.ejs')
                }
                else {
                    console.log(response.data)
                }
            })
        }
    })
}
)

// loads appointment cancel page
// admin can see all appointments
app.get('/admin_cancelappointment', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            axios.get(`http://127.0.0.1:5000/api/AdminCancelAppointment`)
            .then((response)=>{
                var appointments = response.data;
                // render page of cancel appointments
                res.render('pages/admincancelappointment.ejs', {
                    appointments: appointments,
                });
            });
        }
    });
});

// route that shows a appointment is cancelled
app.get('/admincancelsucess', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            res.render('pages/admincancelsucess.ejs')
        }
    })
})

// route that shows the list of all employees
app.get('/employeelist', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            axios.get(`http://127.0.0.1:5000/api/employeelist`)
            .then((response)=>{
                var employees = response.data;
                // render page of cancel appointments
                res.render('pages/employeelist.ejs', {
                    employees: employees,
                });
            });
        }
    });
});


// route that shows all customer appointments, whether cancelled or not
app.get('/employeehome', function(req, res) {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    // verify admin
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
    
            // get customer's appointments' from api
            axios.get(`http://127.0.0.1:5000/api/Appointments`)
            .then((response)=>{
    
                var appointments = response.data;
                var tagline = "Here is the data coming from my own API";
                // render page of appointments
                res.render('pages/employeeindex.ejs', {
                    appointments: appointments,
                    tagline: tagline
                });
            });       
        }
    });
});
// route that shows about us page
app.get('/about_us', (req, res) => {
    res.render('pages/aboutus.ejs')
})

// route that shows that an employees was created
app.get('/newemployeesuccess', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            res.render('pages/employeesuccess.ejs')
        }
    })
})

// shows the form to add a new employee
app.get('/newemployee', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            res.render('pages/addemployee.ejs')
        }
    })
})

// route that shows that an employees ststus was changed (active/innactive)
app.get('/statussuccess', (req, res) => {
    const AdToken = myCache.get('AdToken');
    const token = AdToken.access_token;
    verifyAdminToken(token)
    .then((response) => {
        if (response === null) {
            myCache.del('AdToken');
            res.redirect("/");
        } else {
            res.render('pages/employeestatussuccess.ejs')
        }
    })
})


// geting access and id tokens for customers
// https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html
// https://stackoverflow.com/questions/45785898/how-to-use-the-code-returned-from-cognito-to-get-aws-credentials
// there are two functions because admin and customer are in different pools
app.get('/tokens', async (req, res) => {
    const authorizationCode = req.query.code;
    const url = 'https://customerlog.auth.us-east-1.amazoncognito.com/oauth2/token';
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic MTE5cXVrYnI2dGJrMXY5cTc2azk0Z2hscWU6ZGVvMjk2cmtpMWljbG9wZG1xNTZuZDZ2YTJ1bGc0c21pam83bmZjaDczMHBzMWdsNDJp'
    };
  
    const data = {
      'grant_type': 'authorization_code',
      'client_id': '119qukbr6tbk1v9q76k94ghlqe',
      'code': authorizationCode,
      'redirect_uri': 'http://localhost:8080/tokens'
    };
  
    try {
      const response = await axios.post(url, data, { headers });
      const responseData = JSON.stringify(response.data)
      res.redirect(`/startcustcache?data=${responseData}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
});


// getting tokens for admin account
app.get('/employeetokens', async (req, res) => {
    const authorizationCode = req.query.code;
    const url = 'https://adminlogins.auth.us-east-1.amazoncognito.com/oauth2/token';
  
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic Mmgya3QwNmQ2ZW52N2QxZmdraWNvZWphanA6cHRqY2pyZzVmdnZzMjc2ZzBqY200ZTVrbGc0czd1YWxzZWViaTl1ZHZkZ25zanFhNHMx'
    };
  
    const data = {
      'grant_type': 'authorization_code',
      'client_id': '2h2kt06d6env7d1fgkicoejajp',
      'code': authorizationCode,
      'redirect_uri': 'http://localhost:8080/employeetokens'
    };
  
    try {
      const response = await axios.post(url, data, { headers });
      const responseData = JSON.stringify(response.data)
      res.redirect(`/startadmincache?data=${responseData}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
});

  

// Verifier that expects valid access tokens:
// https://github.com/awslabs/aws-jwt-verify
// this one is for the admin pool
async function verifyAdminToken(jwt) {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: "us-east-1_rkE7sHPaH",
      tokenUse: "access",
      clientId: "2h2kt06d6env7d1fgkicoejajp",
    });
  
    try {
      const payload = await verifier.verify(jwt);
      console.log("Token is valid. Payload:");
      return payload;
    } catch {
      console.log("Token not valid!");
      return null;
    }
}
// this one is for the customer pool
async function verifyToken(jwt) {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: "us-east-1_v6C9Di70U",
      tokenUse: "access",
      clientId: "119qukbr6tbk1v9q76k94ghlqe",
    });
  
    try {
      const payload = await verifier.verify(jwt);
      console.log("Token is valid. Payload:");
      return payload;
    } catch {
      console.log("Token not valid!");
      return null;
    }
}


// function to decode id_token from cognito tokens to get customer info
// https://www.npmjs.com/package/jwt-decode
function decodeIdToken(idToken) {
    const decodedToken = jwtDecode(idToken);
    return decodedToken;
}

// logs out the user and removes cache
app.get('/logout', (req, res) => {
    myCache.del('UserToken');
    res.render('pages/logout.ejs')
})
  
app.listen(port);
console.log('listening for request on port' + port);
