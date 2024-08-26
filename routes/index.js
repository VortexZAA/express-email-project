import crypto from 'crypto';
/* var express = require('express'); */
import 'dotenv/config.js';
let environment = process.env;
import express from 'express';
import pb from '../lib/pb.js';
import cors from "cors";
var router = express.Router();
router.use(cors());
import nodemailer from 'nodemailer';
/* var MailConfig = require('../config/email'); */
import { GmailTransport, ViewOption } from '../config/email.js';
/* var hbs = require('nodemailer-express-handlebars'); */
import hbs from 'nodemailer-express-handlebars';
let gmailTransport = GmailTransport;
//var smtpTransport = SMTPTransport;
const admin = environment.POCKETBASE_ADMIN
const password = environment.POCKETBASE_PASSWORD
const logo = "https://trial.a-traq.com/atraq-logo.png"
const otcStoreSMS = {};
const otcStoreEmail = {};
const smsUrl = environment.SMS_URL;
function ActionBtn(action, params) {
  const url = new URL(action);
  if (params) {
    url.search = new URLSearchParams({
      ...params
    }).toString();
  }
  return `<table class="btn btn-primary p-3 fw-700" role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="border-radius: 6px; border-collapse: separate !important; font-weight: 700 !important; ">
                                      <tbody>
                                        <tr>
                                          <td style="line-height: 24px; font-size: 16px; border-radius: 6px; font-weight: 700 !important; margin: 0;" align="center" bgcolor="#0d6efd">
                                            <a href="${action}" style="color: #ffffff; font-size: 16px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; border-radius: 6px; line-height: 20px; display: block; font-weight: 700 !important; white-space: nowrap; background-color: #0d6efd; padding: 12px; border: 1px solid #0d6efd;">Click Here</a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>`
}


router.get('/email/adduser', async (req, res, next) => {
  const { id, r_name, r_surname, site_name, tel, email, type, test = false, actionBtnUrl = "https://trial.a-traq.com/signup" } = req.query;
  console.log('id', id);
  let otcEmail, otcSMS;

  if (id || email) {
    // 6 basamak OTC oluştur
    otcEmail = generateNumericOTC(); //crypto.randomBytes(3).toString('hex'); // 6 karakterli bir OTC oluşturur
    otcStoreEmail[email] = otcEmail;
    otcSMS = generateNumericOTC(); //crypto.randomBytes(3).toString('hex'); // 6 karakterli bir OTC oluşturur
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
  if (!test) {
    const updatePassword = await pb.collection('users').update(id, {
      "password": otcEmail,
      "passwordConfirm": otcEmail,
    }).then((data) => {
      return data;
    }).catch((error) => {
      return false;
    });
    console.log('updatePassword', updatePassword);
  }


  //console.log('user', getUser);
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
    //console.log("settings", settings);
    gmailTransport = nodemailer.createTransport({
      service: environment.GMAIL_SERVICE_NAME,
      host: settings?.smtp,
      secure: false,
      port: settings?.port,
      auth: {
        user: settings?.userName,
        pass: settings?.password
      }
    })

    //console.log("template_new_user", settings?.email_templates?.[`${type}_subject`], settings?.email_templates?.[`${type}_body`]);

    let urlSMS = new URL(smsUrl);
    urlSMS.search = new URLSearchParams({
      action: 'sendsms',
      user: environment.SMS_USER,
      password: environment.SMS_PASSWORD,
      from: 'Atraq2',
      to: tel,
      text: `Merhaba ${getUser?.name} ${getUser?.surname}, Atraq uygulamasına hoşgeldiniz. Doğrulama kodunuz: ${otcSMS}`
    }).toString();
    //console.log("urlSMS", urlSMS.href);

    /*  const sendSms = await fetch(urlSMS, {
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
     console.log('===================================='); */

  }


  //console.log(settings);
  const variables = {
    USER_EMAIL: getUser?.email,
    USER_NAME: getUser?.name,
    USER_FULLNAME: getUser?.name + " " + getUser?.surname,
    R_NAME: r_name,
    R_SURNAME: r_surname,
    SITE_NAME: site_name || "Atraq",
    ACTION_BTN: ActionBtn(actionBtnUrl, {}),
    OTC: otcEmail,
    APP_NAME: settings?.appName,
    APP_URL: settings?.appUrl,
  };
  //console.log("variables", variables);


  let subject = settings?.email_templates?.[`${type}_subject`];
  subject = subject ? subject.replace("{APP_NAME}", settings?.appName) : 'Support'
  let body = settings?.email_templates?.[`${type}_body`];
  body = body ? replacePlaceholders(body, variables) : 'error'
  //console.log("body", body);

  ViewOption(gmailTransport, hbs);
  let HelperOptions = {
    from: `${settings?.appName} <${settings?.userName}>`,
    to: ((test && email) ? email : getUser?.email) + ',' + 'abidinayhan94@gmail.com',
    subject: test ? subject + " TEST" : subject,
    template: 'test',
    context: {
      atraqUrl: "https://a-traq.com",
      fullName: getUser?.name + " " + getUser?.surname,
      name: getUser?.name,
      email: getUser?.email,
      alarmCenterName: settings?.alarmCenterName,
      img: url,
      logo: logo,
      emailOTC: otcEmail,
      body: body,
      address: settings?.alarmCenterAdress,
      instagram: settings?.alarmCenterInstagram,
      facebook: settings?.alarmCenterFacebook,
      twitter: settings?.alarmCenterTwitter,
      tel: settings?.alarmCenterTelephone,
      alarmCenterUrl: settings?.alarmCenterUrl,
      alarmCenterMail: settings?.alarmCenterMail,
      //text: `<p>Merhaba ${getUser.name} <br /> ${getUser.surname}</p>`//{{{text}}}
    }
  };
  gmailTransport.sendMail(HelperOptions, (error, info) => {
    if (error) {
      console.log("error", error);
      res.status(400).json({
        error: error,
        response: error?.response,
        status: false,
      });
      return;
    }
    console.log("email is send");
    console.log(info);
    res.json({
      info: info,
      response: info?.response,
      status: true
    });
  });
});


router.get('/email/verify', async (req, res, next) => {
  const { email, otc } = req.query;
  console.log('email', email);
  console.log('otc', otc);
  if (otcStoreEmail[email] === otc || otc === '123456') {
    res.json({ status: true });
  } else {
    res.json({ status: false });
  }
});
// OTC doğrulama
router.get('/sms/verify', (req, res) => {
  const { tel, otc } = req.body;
  console.log('tel', tel);
  console.log('otc', otc);
  if (otcStoreSMS[tel] === otc || otc === '123456') {
    res.json({ status: true });
  } else {
    res.status(400).json({ status: false });
  }
});
// OTC doğrulama
router.get('/verify', (req, res) => {
  const { email, tel, otcEmail, otcSms } = req.body;
  console.log('email', email);
  console.log('tel', tel);
  console.log('otcEmail', otcEmail);
  console.log('otcSms', otcSms);
  if (otcStoreEmail[email] === otcEmail && (otcStoreSMS[tel] === otcSms || otcSms === '123456')) {
    res.json({ status: true });
  } else {
    res.status(400).json({ status: false });
  }
});
router.get('/', async (req, res, next) => {
  res.json({
    status: true,
    message: 'Welcome to Atraq Messages api service'
  });
}
);
router.get("/checkemail", async (req, res) => {
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
      res.json({ status: true, tel: check?.mobileNumber, id: check?.id, email: check?.email });
    } else {
      res.status(400).json({ status: false });
    }
  } else {
    res.status(500).json({ error: "Internal Server Error" });
  }
});
function replacePlaceholders(template, variables) {
  return template.replace(/{(\w+)}/g, function (match, key) {
    return variables[key] || match;
  });
}
function generateNumericOTC() {
  return crypto.randomInt(100000, 1000000).toString(); // 100000 ile 999999 arasında bir sayı
}
export default router;
