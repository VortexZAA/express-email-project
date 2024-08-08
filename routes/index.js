import crypto from 'crypto';
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
let gmailTransport = GmailTransport;
var smtpTransport = SMTPTransport;
const admin = environment.POCKETBASE_ADMIN
const password = environment.POCKETBASE_PASSWORD
const logo = "https://trial.a-traq.com/atraq-logo.png"
const otcStoreSMS = {};
const otcStoreEmail = {};
const smsUrl = environment.SMS_URL;
router.get('/email/adduser', async (req, res, next) => {
  const { id, name, surname, tel, email, } = req.query;
  console.log('id', id);
  let otcEmail, otcSMS;
  if (id || email) {
    otcEmail = crypto.randomBytes(3).toString('hex'); // 6 karakterli bir OTC oluşturur
    otcStoreEmail[email] = otcEmail;
    otcSMS = crypto.randomBytes(3).toString('hex'); // 6 karakterli bir OTC oluşturur
    otcStoreSMS[tel] = otcSMS;
  }
  const loginAdmin = await pb.admins.authWithPassword(admin, password).then((data) => {
    return data;
  }).catch((error) => {
    return false;
  });
  //console.log('loginAdmin', loginAdmin);
  const getUser = await pb.collection('users').getOne(id).then((data) => {
    return data;
  }).catch((error) => {
    return false;
  });
  console.log('user', getUser);
  /*console.log("decoded", decoded); */
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
    //console.log("settings", settings);
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
    let urlSMS = new URL(smsUrl);
    urlSMS.search = new URLSearchParams({
      action: 'sendsms',
      user: environment.SMS_USER,
      password: environment.SMS_PASSWORD,
      from: 'Atraq2',
      to: tel,
      text: `Merhaba ${name} ${surname}, Atraq uygulamasına hoşgeldiniz. Doğrulama kodunuz: ${otcSMS}`
    }).toString();
    console.log("urlSMS", urlSMS.href);

    const sendSms = await fetch(urlSMS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return true;
      console.log("response", response);

    }).then(data => {
      return data;
    }).catch(error => {
      console.error('There was a problem with the fetch operation:', error);
      return false;
    });
    console.log('====================================');
    console.log('sendSms', sendSms);
    console.log('====================================');

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
      relationName: settings?.alarmCenterName,
      img: url,
      logo: logo,
      emailOTC: otcEmail,
      //text: `<p>Merhaba ${getUser.name} <br /> ${getUser.surname}</p>`//{{{text}}}
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

router.get('/email/verify', async (req, res, next) => {
  const { email, otc } = req.query;
  console.log('email', email);
  console.log('otc', otc);
  if (otcStoreEmail[email] === otc) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
});
// OTC doğrulama
router.post('/sms/verify', (req, res) => {
  const { tel, otc } = req.body;
  console.log('tel', tel);
  console.log('otc', otc);
  if (otcStoreSMS[tel] === otc) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
});
// OTC doğrulama
router.post('/verify', (req, res) => {
  const { email, tel, otcEmail, otcSms } = req.body;
  console.log('email', email);
  console.log('tel', tel);
  console.log('otcEmail', otcEmail);
  console.log('otcSms', otcSms);
  if (otcStoreEmail[email] === otcEmail && otcStoreSMS[tel] === otcSms) {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
});

export default router;
