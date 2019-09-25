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
    mongoid: 'dadhive-main-20193f0912h309',
    secret: 'wjiofn349w84h93w8hg4nilrwubg4p983h402pqh',
    secretLimit: 86400000,
    refresh: 'u393q48go8w74gubwi3uvo837wg4uyqv4k2uh3e9bh09riejoirnsi48',
    refreshLimit: 1814400000,
    nodemailusr: "thedadhive@gmail.com",
    nodemailpass: "Kountdown123",
    nodemailerclientid: "582457802779-jse8ejpv5llk4s4qd8lol4uo3rbdj3o6.apps.googleusercontent.com",
    nodemailerclientsecret: "_J64jVg1N-B-ixi0Y7sS0Ney",
    nodemailerclienttoken: "1/Pr7qllTm6f88K0xTmFmyriECjPVhieQzDh_SeXGTXCIEc766NB--peL2RgDBeZDS",
    cookiename: "DadHiveiwo3ihn2o3in2goi3bnoi",
    cookiesecret: "wh2o38h3489h3oi3j21jp2h10p9fh320p9",
    firapikey: "AIzaSyAo5h-SLSOhVp7z7Oj1hxjFzDNPmG9d808",
    firauthdomain: "dadhive-cc6f5.firebaseapp.com",
    firdburl: "https://dadhive-cc6f5.firebaseio.com",
    firprojectid: "dadhive-cc6f5",
    firstoragebucket: "dadhive-cc6f5.appspot.com",
    firmessagingsenderid: "169871664069",
    firstoragefilename: './dadhive-cc6f5-firebase-adminsdk-l7gqd-c23e8c8e82.json',
    s3AccessKey: '',
    s3SecretKey: '',
    s3bucket: '',
    isLive: false,
    oneDay: 86400000,
    timeout: 72000000
}