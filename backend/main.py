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


app.run()
