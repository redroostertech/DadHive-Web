'use strict';

const path          = require('path');

module.exports = {
    port: 3000,
    siteTitle: 'DadHive',
    base: __dirname,
    basePublic: path.join(__dirname, '/public/'),
    baseRoutes: path.join(__dirname, '/routes/'),
    baseViews: path.join(__dirname, '/views/'),
    mongoUrl: 'mongodb://dadhive-ad:'+encodeURIComponent('Z@r@rox6')+'@dadhive-cluster-sm-shard-00-00-1io7q.mongodb.net:27017,dadhive-cluster-sm-shard-00-01-1io7q.mongodb.net:27017,dadhive-cluster-sm-shard-00-02-1io7q.mongodb.net:27017/test?ssl=true&replicaSet=DadHive-Cluster-sm-shard-0&authSource=admin&retryWrites=true/dadhive-main-20193f0912h309',
    secret: 'wjiofn349w84h93w8hg4nilrwubg4p983h402pqh',
    nodemailusr: "thedadhive@gmail.com",
    nodemailpass: "Kountdown123",
    nodemailerclientid: "582457802779-jse8ejpv5llk4s4qd8lol4uo3rbdj3o6.apps.googleusercontent.com",
    nodemailerclientsecret: "_J64jVg1N-B-ixi0Y7sS0Ney",
    nodemailerclienttoken: "1/Pr7qllTm6f88K0xTmFmyriECjPVhieQzDh_SeXGTXCIEc766NB--peL2RgDBeZDS",
    cookiename: "DadHiveiwo3ihn2o3in2goi3bnoi",
    cookiesecret: "wh2o38h3489h3oi3j21jp2h10p9fh320p9",
    firapikey: "AIzaSyABb1mPNSmzyKK_RvXUi1WoZ5bwIFjLS5M",
    firauthdomain: "dadhive-c1b2f.firebaseapp.com",
    firdburl: "https://dadhive-c1b2f.firebaseio.com",
    firprojectid: "dadhive-c1b2f",
    firstoragebucket: "dadhive-c1b2f.appspot.com",
    firmessagingsenderid: "259732187078",
    firstoragefilename: './dadhive-cc6f5-firebase-adminsdk-l7gqd-c23e8c8e82.json',
    s3AccessKey: '',
    s3SecretKey: '',
    s3bucket: '',
    isLive: false,
    oneDay: 86400000,
    timeout: 72000000
}