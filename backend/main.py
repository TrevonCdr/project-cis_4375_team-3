import flask
from flask import jsonify
from flask import request, make_response
import mysql.connector
from mysql.connector import Error
from SQL import create_connection
from SQL import execute_query
from SQL import execute_read_query

#setting up the application
app = flask.Flask(__name__) #sets up the application
app.config["DEBUG"] = True #all to show errors in browser

#Establishing the connection to my server:

conn = create_connection('cis4375project.ceaacvjhw0y3.us-east-1.rds.amazonaws.com', 'admin', 'C!s4e75Gr0up3!', 'CIS4375Project')

#localhost:5000/api/Contacttype
@app.route('/api/Contacttype', methods=['GET'])
def api_contacttype():

    #query for sql to see contact type table:

    query = """SELECT contact_method_status
AS 'Most Used Contact Type'FROM CIS4375Project.Customer
inner join CIS4375Project.ContactMethod
ON Customer.contact_method_id = ContactMethod.contact_method_id
Group by Customer.contact_method_id
order by count(*) DESC
Limit 1;"""

    methodinfo = execute_read_query(conn, query)

    #adds the data to a blank list then returns it with jsonify:

    contactmethoddata = []

    for method in methodinfo:
        contactmethoddata.append(method)
    
    return jsonify(contactmethoddata)

#localhost:5000/api/MostandLeastCommonService
@app.route('/api/MostandLeastCommonService', methods=['GET'])
def api_MostLeastCommon():

    #query for sql to see contact type table:

    query1 = """SELECT service_type as 'Most Common Service' from CIS4375Project.Service
    inner join CIS4375Project.AppointmentService
    ON AppointmentService.service_id = Service.service_id
    inner join CIS4375Project.Appointment
    ON AppointmentService.appointment_id = Appointment.appointment_id
    Group by AppointmentService.service_id
    Order by count(AppointmentService.service_id) desc
    limit 1;"""

    query2 = """SELECT service_type as 'Least Common Service' from CIS4375Project.Service
inner join CIS4375Project.AppointmentService
ON AppointmentService.service_id = Service.service_id
inner join CIS4375Project.Appointment
ON AppointmentService.appointment_id = Appointment.appointment_id
Group by AppointmentService.service_id
Order by count(AppointmentService.service_id) asc
LIMIT 1;"""

    serviceinfo = execute_read_query(conn, query1)
    serviceinfo2 = execute_read_query(conn, query2)

    #adds the data to a blank list then returns it with jsonify:

    commonservicedata = []
    leastcommondata = []

    for service in serviceinfo:
        commonservicedata.append(service)

    for service in serviceinfo2:
        leastcommondata.append(service)
    
    return jsonify(commonservicedata,leastcommondata)

#query for Earnings per year, week, day
#localhost:5000/api/Earnings
@app.route('/api/Earnings', methods=['GET'])
def api_Earnings():
        # Earnings Per Week
        query1 = """SELECT STR_TO_DATE(CONCAT(YEARWEEK(appointment_date, 0), ' ', 'Sunday'), '%X%V %W') AS 'Week Start', 
       STR_TO_DATE(CONCAT(YEARWEEK(appointment_date, 0), ' ', 'Saturday'), '%X%V %W') AS 'Week End',
        SUM(appointment_total) AS Earnings
        FROM Appointment
        WHERE appointment_status <> 'CANCELED'
        GROUP BY YEARWEEK(appointment_date)
        ORDER BY YEARWEEK(appointment_date);"""
        
        # Earnings Per Month and Year
        query2 = """SELECT year(appointment_date) as "Year", monthname(appointment_date) as "Month", sum(appointment_total) as "Earnings"
        from Appointment
        WHERE appointment_status <> 'CANCELED'
        group by year(appointment_date),month(appointment_date)
        order by year(appointment_date),month(appointment_date);"""
      
        #Earnings for the current date
        query3 = """SELECT curdate() as "Today's date", sum(appointment_total) "Today's earnings"
        from Appointment
        where appointment_date = curdate()
        AND appointment_status <> 'CANCELED';"""

        #Earnings Per Customer
        query4 = """SELECT Concat(Customer.first_name,' ', Customer.last_name) as 'Customer Name', sum(appointment_total) as 'Earnings' from Appointment
        join Customer
        on Appointment.customer_id = Customer.customer_id
        group by Appointment.customer_id;"""


        earningsinfo = execute_read_query(conn, query1)
        earningsinfo2 = execute_read_query(conn, query2)
        earningsinfo3 = execute_read_query(conn, query3)
        earningsinfo4 = execute_read_query(conn, query4)

    #adds the data to a blank list then returns it with jsonify:

        earningsperweek = []
        earningsweeklymonthly = []
        earningscurrent = []
        earningspercustomer= []
        
        for earnings in earningsinfo:
            earningsperweek.append(earnings)

        for earnings in earningsinfo2:
            earningsweeklymonthly.append(earnings)
        
        for earnings in  earningsinfo3:
            earningscurrent.append(earnings)

        for earnings in  earningsinfo4:
            earningspercustomer.append(earnings)
    
        return jsonify(earningsperweek,earningsweeklymonthly,earningscurrent,earningspercustomer)








        







@app.route('/api/add/appointment', methods=['POST'])
def add_appointment():
    request_data = request.get_json()
    #newid = request_data['id']
    newcustid = request_data['customer_id']
    newemployee_id = request_data['employee_id']
    newappointment_date = request_data['appointment_date']
    newcustomer_note = request_data['customer_note']
    newappointment_status = request_data['appointment_status']
    newappointment_total = request_data['appointment_total']
    #sql query for inserting appointment then execute with given data
    #if newcustomer_note has 'haircut'
    #then 
    #service_id= '1'



    query_insert_appointment = """INSERT
    INTO Appointment ( customer_id, employee_id, appointment_date, customer_note, appointment_status, appointment_total) 
    values ('%s','%s','%s','%s','%s','%s')"""%(newcustid,newemployee_id, newappointment_date, newcustomer_note, newappointment_status, newappointment_total)

    query_insert_AppointmentService = "INSERT INTO AppointmentService (service_id, appointment_id) values (1,12)"
    execute_query(conn, query_insert_appointment)


    execute_query(conn, query_insert_AppointmentService)

    return 'Add request successful!' 


"""BEGIN;
INSERT
INTO Appointment ( customer_id, employee_id, appointment_date, customer_note, appointment_status, appointment_total) 
values ('%s','%s','%s','%s','%s','%s') %(newcustid,newemployee_id, newappointment_date, newcustomer_note, newappointment_status, newappointment_total)
INSERT INTO AppointmentService (service_id, appointment_id) values (1,12);
COMMIT;"""




app.run()