/* var express = require('express'); */
import 'dotenv/config.js';
let environment = process.env;
import express from 'express';
import pb from '../lib/pb.js';
var router = express.Router();
import nodemailer from 'nodemailer';
/* var MailConfig = require('../config/email'); */
import { GmailTransport, SMTPTransport, ViewOption } from '../config/email.js';
/* var hbs = require('nodemailer-express-handlebars'); */
import hbs from 'nodemailer-express-handlebars';
import jwt from 'jsonwebtoken';
let gmailTransport = GmailTransport;
var smtpTransport = SMTPTransport;
const admin = environment.POCKETBASE_ADMIN
const password = environment.POCKETBASE_PASSWORD

router.get('/email/adduser', async (req, res, next) => {
  const { token } = req.query;
  console.log('token', token);
  const decoded = jwt.decode(token);
  const id = decoded?.id || decoded?.payload?.id;
  const loginAdmin = await pb.admins.authWithPassword(admin, password).then((data) => {
    return data;
  }).catch((error) => {
    return false;
  });
  console.log('loginAdmin', loginAdmin);
  const getUser = await pb.collection('users').getOne(id).then((data) => {
    return data;
  }).catch((error) => {
    return false;
  });
  /* console.log('user', getUser);
  console.log("decoded", decoded); */
  const settings = await pb.collection('program_settings').getFullList().then((data) => {
    return data[0];
  }).catch((error) => {
    console.log(error);
    return false;
  });
  let url = '';
  if (settings) {
    console.log('====================================');
    console.log("oldu", environment.GMAIL_SERVICE_NAME, settings?.smtp, false, settings?.port, settings?.userName, settings?.password);
    console.log('====================================');
    console.log("settings", settings);
    url = pb.files.getUrl(settings, settings?.logoFile);
    console.log("url", url);
    gmailTransport = nodemailer.createTransport({
      service: environment.GMAIL_SERVICE_NAME,
      host: settings?.smtp,
      secure: false,
      port: settings?.port,
      auth: {
        user: settings?.userName,
        pass: settings?.password
      }
    });
  }

  //console.log(settings);
  ViewOption(gmailTransport, hbs);
  let HelperOptions = {
    from: '"Atraq" <alarm@a-traq.com>',
    to: getUser?.email + ',' + 'abidinayhan94@gmail.com',
    subject: 'Hellow world!',
    template: 'test',
    context: {
      fullName: getUser?.name + " " + getUser?.surname,
      name: getUser?.name,
      email: getUser?.email,
      relationName: 'deneme',
      img: url
    }
  };
  gmailTransport.sendMail(HelperOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.json(error);
    }
    console.log("email is send");
    console.log(info);
    res.json(info)
  });
});

/* router.get('/email/smtp/template', (req, res, next) => {
  MailConfig.ViewOption(smtpTransport, hbs);
  let HelperOptions = {
    from: '"Atraq" <alarm@a-traq.com>',
    to: 'abidinayhan94@gmail.com',
    subject: 'Hellow world!',
    template: 'test',
    context: {
      name: "tariqul_islam",
      email: "tariqul.islam.rony@gmail.com",
      address: "52, Kadamtola Shubag dhaka",
      img: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'
    }
  };
  smtpTransport.verify((error, success) => {
    if (error) {
      res.json({ output: 'error', message: error })
      res.end();
    } else {
      smtpTransport.sendMail(HelperOptions, (error, info) => {
        if (error) {
          res.json({ output: 'error', message: error })
        }
        res.json({ output: 'success', message: info });
        res.end();
      });
    }
  })

}); */

export default router;
