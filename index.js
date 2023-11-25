const express = require('express');
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors');
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

const {MongoClient, ServerApiVersion} = require('mongodb');
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
    };

    // post requiests
    app.post('/users', async (req, res) => {
      const user = req.body;
      user.isVerify = false;

      const result = await usersDb.insertOne(user);

      console.log(user);

      res.send(result);
    });

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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on${port}`);
});