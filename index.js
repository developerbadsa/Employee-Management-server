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
      const decEmail = req?.decoded?.email
      const query = {email: decEmail};
      const user = await usersDb.findOne(query);
      const isEmployee = user?.position === 'Employee';


      if (!isEmployee) {
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    };
    //Verify HR
    const verifyHR = async (req, res, next) => {
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersDb.findOne(query);
      const isAdmin = user?.position === 'HR';
      if (!isAdmin) {
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    };

    // verify  admin
    const verifyAdmin = async (req, res, next) => {
      const email = req?.decoded?.email;
      const query = {email: email};
      const user = await usersDb.findOne(query);
      const isAdmin = user?.position === 'Admin';
      if (!isAdmin) {
        return res.status(403).send({message: 'forbidden access'});
      }
      next();
    };





    //   =======================  get requests=============================



    // get all Employee List -------HR----------
    app.get('/employee-list',verifyToken, verifyHR, async (req, res) => {
      const employees = await usersDb.find({position: 'Employee'}).toArray();

      res.send(employees);
    });


    //get verified users and only hr ----------admin---------------
    app.get('/employee-list/verified',  verifyToken, verifyAdmin,  async (req, res) => {
        const employeesVerified = await usersDb.find({
            $or: [{position: 'Employee', isVerify: true}, {position: 'HR'}],
          })
          .toArray();
        res.send(employeesVerified);
      }
    );

    //Employee Details Route -----------HR----------------
    app.get('/employee-list/:id', verifyToken, verifyHR, async (req, res) => {
      const id = req.params.id;

      const result = await usersDb.findOne({_id: new ObjectId(id)});
      res.send(result);
    });

    //     payment statics ---------------HR-----------------
    app.get('/payment-list/:email', verifyToken, verifyHR, async (req, res) => {
      const email = req.params.email;
      const result = await paymentsDb
        .find({email: `${email}`})
        .project({month: 1, year: 1, paidAmount: 1, _id: 0})
        .toArray();
      res.send(result);
    });

       //    get payments ---------------HR-----------------
    app.get('/payment-list-check', verifyToken, verifyHR, async (req, res) => {
      const {month, email, year} = req.query.formData
      const paymentsData = await paymentsDb.find({email: `${email}`}).project({month: 1, year: 1, _id: 0}).toArray();


     const isMatched = paymentsData.filter(data=>data.month === month && data.year === year)

      if(isMatched?.length){
            res.send(false);
      }else{
            res.send(true);
      }


    });


//Work Sheet Employee ---------------- Employee ----------------
    app.get('/employee-task', verifyToken, verifyEmployee, async (req, res) => {
      const {email} = req?.query

if(email ){
      const result = await tastsDb .find({userEmail: email}) .project({task: 1, workedHours: 1, workedDate: 1, _id: 0}) .toArray();
      res.send(result)
}
  
    });

    //All Task Of users for progress page ---------------HR-----------
    app.get('/all-tasks',verifyToken, verifyHR, async(req, res)=>{

      const result = await tastsDb.find().project({task: 1, workedHours: 1, workedDate: 1,userName:1, _id: 0}).toArray();
    res.send(result);
    })
    //   check user in bd
    app.get('/check-user', async(req, res)=>{
      const {FirebaseLoggedEmail, FirebaseLoggedName} = req.query
      const result =await usersDb.findOne({email: FirebaseLoggedEmail, name: FirebaseLoggedName})
      res.send(result)
    })




    //======================= post requiests===============================

//     when user register post data to DB
    app.post('/users', async (req, res) => {
      const user = req.body;
      user.isVerify = false;

      const result = await usersDb.insertOne(user);

      res.send(result);
    });


//  Pay to Employee   --------HR-------

    app.post('/pay-to-employee',verifyToken, verifyHR, async (req, res) => {
      const payData = req?.body;

      const result = await paymentsDb.insertOne(payData);
      res.send(result);
    });

    //     check hr
    app.post('/isHR', async (req, res) => {
      const {email} = req?.body;

      const result = await usersDb.findOne({email});

      if (result?.position === 'HR') {
        res.send(true);
      } else {
        res.send(false);
      }
    });
    //     check employee
    app.post('/isEmployee', async (req, res) => {
      const {email} = req?.body;

      const result = await usersDb.findOne({email});

      if (result?.position === 'Employee') {
        res.send(true);
      } else {
        res.send(false);
      }
    });

    //     check Admin
    app.post('/isAdmin', async (req, res) => {
      const {email} = req?.body;

      const result = await usersDb.findOne({email});

      if (result?.position === 'Admin') {
        res.send(true);
      } else {
        res.send(false);
      }
    });

    // paymwnt history ---------Employee--------
    app.post('/payment-history',verifyToken, verifyEmployee , async (req, res) => {
      const {email} = req?.body;

      const result = await paymentsDb
        .find({email})
        .project({month: 1, paidAmount: 1, tnxid: 1, _id: 0})
        .toArray();
      res.send(result);
    });


//     post employee tasks -insert ---------- Emplopyee-------------
    app.post('/employee-tasks',verifyToken, verifyEmployee, async (req, res) => {
      
      const EmployeeData = req.body;
      const result = await tastsDb.insertOne(EmployeeData);
      res.send(result);
    });


    //     ===============================Update REQUESTS ==========================
    //update user Verify status ----------HR-----------
    app.put('/employee-verify-update:id',verifyToken, verifyHR, async (req, res) => {
      const id = req.params.id;

      const updateDoc = {
        $set: {
          isVerify: true,
        },
      };
      const result = await usersDb.updateOne(
        {_id: new ObjectId(id)},
        updateDoc
      );
      res.send(result);
    });

    //Update user role for Make HR
    app.put('/users/makeHR',verifyToken, verifyAdmin, async (req, res) => {
      const {id} = req.body;

      const result = await usersDb.updateOne(
        {_id: new ObjectId(id)},
        {
          $set: {
            position: `HR`,
          },
        }
      );

      res.send(result);
    });

    //     ===============================DELETE REQUESTS ==========================

    // fire user from admin
    app.delete('/users/fire',verifyToken, verifyAdmin, (req, res) => {
      const userId = req.body.userID;

      const result = usersDb.deleteOne({_id: new ObjectId(userId)});

      res.send(result);
    });

    app.get('/',verifyToken, (req, res) => {
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
