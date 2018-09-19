const config = require('./config.json');
const fs = require('fs');
const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const https = require('https');
const cv = require('opencv');

let dst = __dirname + '/images';
let tg;

function create() {
    tg = new TelegramBot(config.token, {
        polling: true
    });
    tg.on('message', onMessage);
    tg.on('callback_query', onCallbackQuery);
}

function onMessage(message) {

  if (message.photo) {
    console.log('message:', message);

    tg.downloadFile(message.photo[message.photo.length-1].file_id, dst).then(
      result => {

        console.log("File downloaded: " + result);

        cv.readImage(result, function(err, im){
          if (err)
            console.log("Error while cv readImage", err);

          if (im.width() < 1 || im.height() < 1) throw new Error('Image has no size');

          console.log("start detection...");
          console.log(im.width(), im.height());

          im.detectObject("./data/haarcascade_frontalface_alt.xml", {}, function(err, faces){
            console.log(err, faces)
            if (err)
             console.log(err);

            for (var i = 0; i < faces.length; i++){
               var face = faces[i];
               im.ellipse(face.x + face.width / 2, face.y + face.height / 2, face.width / 2, face.height / 2, [255, 255, 0], 3);
             }

             console.log("saving... ");
             if (im.save(result)) {
                console.log('Image saved.');
                tg.sendPhoto(message.chat.id, result).then(
                 result => {
                   //console.log("Photo sended: ", result);
                   console.log("Photo sended:");
                 },
                 error => {
                   console.log("Error while sending photo: ", error);
                 });
              } else {
                console.log("Error while saving image");
              }
          });
        });

      },
      error => {
        console.log("Error while downloading file: " + error);
    });
  }

}

function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
}
create();