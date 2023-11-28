const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const usersDb = client.db('usersDB').collection('usersCollection');
    const paymentsDb = client.db('payment').collection('paymentCollections');
    const tastsDb = client.db('task').collection('taskCollection');

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
      res.send({token});
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({message: 'unauthorized access'});
      }
      const token = req.headers.authorization;
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({message: 'unauthorized access'});
        }
        req.decoded = decoded;
        next();
      });
    };
        //Verify Employee
        const verifyEmployee = async (req, res, next) => {
            const email = req.decoded.email;
            const query = {email: email};
            const user = await usersDb.findOne(query);
            const isAdmin = user?.role === 'Employee';
            if (!isAdmin) {
              return res.status(403).send({message: 'forbidden access'});
            }
            next();
          };
    //Verify HR
    const verifyHR = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersDb.findOne(query);
      const isAdmin = user?.role === 'HR';
      if (!isAdmin) {
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    };

    // verify  admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersDb.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    } 


//     get requests
    app.get('/employee-list',  async (req, res)=>{

      const employees = await usersDb.find({position: 'Employee'}).toArray()

      res.send(employees)
    })
//     get requests
    app.get('/employee-list/verified',  async (req, res)=>{

      const employeesVerified = await usersDb.find({position: 'Employee', isVerify:true}).toArray()
      console.log(employeesVerified)
      res.send(employeesVerified)
    })



    app.get('/employee-list/:id',verifyToken,  async (req, res)=>{

      const id = req.params.id

      const result = await usersDb.findOne({_id: new ObjectId(id)})
      // console.log(result)
      res.send(result)
    })


//     payment statics
    app.get('/payment-list/:email',verifyToken,  async (req, res)=>{

      const email = req.params.email

      const result = await paymentsDb.find({ email: `${email}` }).project({ month: 1, year: 1, paidAmount: 1 , _id: 0}).toArray()
      res.send(result)
    })

    app.get('/employee-task', async(req,res)=>{
      const {email} = req?.body

        const result =await tastsDb.find({email} ).project({ task: 1, workedHours: 1, workedDate: 1 , _id: 0}).toArray()
      res.send(result)
    })





    // post requiests
    app.post('/users', async (req, res) => {
      const user = req.body;
      user.isVerify = false;

      const result = await usersDb.insertOne(user);


      res.send(result);
    });

    app.post('/pay-to-employee', async(req,res)=>{
      const payData = req?.body

      const result =await paymentsDb.insertOne(payData)


      console.log(result)
      res.send(result)
    })


//     check hr
    app.post('/isHR', async(req,res)=>{
      const {email} = req?.body

       const result =await usersDb.findOne({email} )

       if(result?.position==="HR"){
            res.send(true)
       }else{
            res.send(false)
       }
    })
    //     check employee
    app.post('/isEmployee', async(req,res)=>{
      const {email} = req?.body

       const result =await usersDb.findOne({email} )

       if(result?.position==="Employee"){
            res.send(true)
       }else{
            res.send(false)
       }
    })

    //     check Admin
    app.post('/isAdmin', async(req,res)=>{
      const {email} = req?.body

       const result =await usersDb.findOne({email} )

       console.log(email)

       if(result?.position==="Admin"){
            res.send(true)
       }else{
            res.send(false)
       }
    })


    // paymwnt history
    app.post('/payment-history', async(req,res)=>{
      const {email} = req?.body

       const result =await paymentsDb.find({email} ).project({ month: 1, paidAmount: 1, tnxid: 1 , _id: 0}).toArray()
      res.send(result)
    })


    app.post('/employee-tasks', async(req,res)=>{
      const email = req.query.email
      const EmployeeData = req.body
       const result = await tastsDb.insertOne(EmployeeData )
      res.send(result)
      console.log( result)
    })




    //update user Verify status
    app.put('/employee-verify-update:id', async(req, res)=>{
      const id = req.params.id

      const updateDoc = {
            $set: {
            isVerify: true
            },
          };
      const result = await usersDb.updateOne({ _id:new ObjectId(id)}, updateDoc);
      res.send(result)

    })


    //Update user role for Make HR
    app.put('/users/makeHR', async (req, res) => {
      const {id} = req.body;

      const result = await usersDb.updateOne({_id:new ObjectId(id)}, {$set: {
            position : `HR`
          }})
console.log(result)

      res.send(result);
    })










    app.get('/', (req, res) => {
      res.send('Hello, World!');
    });

    await client.db('admin').command({ping: 1});
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
  }
}
run().catch(console.dir);

// Start the serve
app.listen(port, () => {
  console.log(`Server is running on${port}`);
});
