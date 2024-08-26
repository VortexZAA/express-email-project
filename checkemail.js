import express from "express";
import pb from '../lib/pb.js';
const app = express();
import cors from "cors";
app.use(
  cors(/* {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 200,
    allowedHeaders: ["Content-Type"],
  } */)
);

app.use(express.json());
const admin = environment.POCKETBASE_ADMIN
const password = environment.POCKETBASE_PASSWORD

app.get("/checkemail", async (req, res) => {
  const { email } = req.query;
  const loginAdmin = await pb.admins.authWithPassword(admin, password).then((data) => {
    return data;
  }).catch((error) => {
    return false;
  });
  if (loginAdmin) {
    const check = await pb.collection('users').getFirstListItem(`email="${email}"`).then((data) => {
      return data;
    }).catch((error) => {
      return false;
    });
    if (check) {
      res.json({ status: true, tel:check?.mobileNumber, id:check?.id ,email:check?.email}); 
    } else {
      res.status(400).json({ status: false });
    }
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});