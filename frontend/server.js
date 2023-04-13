var express = require('express');
var app = express();
var path = require('path');
const axios = require('axios');
const port = 8080;
const bodyParser  = require('body-parser');


const { response } = require('express');
const { request } = require('express');

var selectedID = "";
app.use(bodyParser.urlencoded());

app.set("views", path.resolve(__dirname, "views"));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    res.render('pages/index.ejs')
})

app.get('/employeehome', function(req, res) {
    
    // get customer's appointments' from api
    axios.get(`http://127.0.0.1:5000/api/AppointmentsCustomer`)
        .then((response)=>{
    
        var appointments = response.data;
        var tagline = "Here is the data coming from my own API";
        // render page of appointments
        res.render('pages/employeeindex.ejs', {
            appointments: appointments,
            tagline: tagline
        });
    });       
});

app.get('/customerhome', function(req, res) {

     // get customer's appointments' from api
     axios.get(`http://127.0.0.1:5000/api/AppointmentsCustomer`)
     .then((response)=>{
 
     var appointments = response.data;
     var tagline = "Here is the data coming from my own API";
     // render page of appointments
     res.render('pages/customerindex.ejs', {
         appointments: appointments,
         tagline: tagline
     });
  });
});


app.get('/createappointment', (req, res) => {
    
    const employeesurl = 'http://127.0.0.1:5000/api/Employees';
    const servicesurl = 'http://127.0.0.1:5000/api/Services';
    
    const date = new Date();
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
            })
        });
    });    
});
    
app.get('/showreports', (req, res) => {

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
});

// add appointment info to database
app.post('/add_appointment', function(req, res){
    
    var olddate = req.body.date;
    var date = olddate.replace('-','/')
    date = date.replace('-','/')
    
    
    var time = req.body.time;
    time = time + ':00'
    
    var phoneNumber = req.body.phoneNumber;
    var employeeid = req.body.employeeid;

    // split service id and price info
    var serviceinfo = req.body.serviceinfo;
    
    if (typeof serviceinfo == 'string') {
            serviceinfo = serviceinfo.split(" ");
            var serviceid = [];
            serviceid.push(serviceinfo[0]);
            var servicePrice = serviceinfo[1];
    }   else {
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
    'phone_number': phoneNumber,
    'employee_id' : employeeid,
    'service_id' : serviceid,
    'appointment_total': servicePrice,
    'customer_note' : customerNote
    }
    console.log(appointmentinfo)
    
    //send to backend api
    axios.post('http://127.0.0.1:5000/api/add/appointment', appointmentinfo)
    .then(function (response) {
        if ((response.data) === 'Appointment added successfully') {
            res.render('pages/createsuccess.ejs')
        }
        else {
            console.log(response.data)
        }
    })
})
// cancel page
app.get('/cancelappointment', (req, res) => {
    axios.get(`http://127.0.0.1:5000/api/CancelAppointment`)
     .then((response)=>{
     var appointments = response.data;
     // render page of cancel appointments
     res.render('pages/cancelappointment.ejs', {
         appointments: appointments,
     });
  });

});

app.get('/createsuccess', (req, res) => {
    res.render('pages/createsuccess.ejs')
})


app.get('/cancelsuccess', (req, res) => {
    res.render('pages/cancelsuccess.ejs')
})

app.get('/newemployeesuccess', (req, res) => {
    res.render('pages/employeesuccess.ejs')
})


app.get('/logout', (req, res) => {
    res.render('pages/logout.ejs')
})

app.get('/newemployee', (req, res) => {
    res.render('pages/addemployee.ejs')
})

app.post('/add_employee', function(req, res) {
    var employeeFirstName = req.body.employeefname;
    var employeeLastName = req.body.employeelname;
    var employeeStatus = req.body.employeestatus;

    var employeeinfo = {
        'employee_first_name': employeeFirstName,
        'employee_last_name': employeeLastName,
        'employee_status': employeeStatus,
        }

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
)


  
app.listen(port);
console.log('listening for request on port' + port);
