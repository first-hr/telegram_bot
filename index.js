const Telegraf = require('telegraf');
const fs = require('fs');
const session = require('telegraf/session');
const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
const { authorize } = require('./googleAuthorization');
const { addRow, getRows } = require('./googleQueris');
const Moment = require('moment');
const MomentRange = require('moment-range');
const _ = require('lodash');
const moment = MomentRange.extendMoment(Moment);
require('dotenv').config();
const { enter, leave } = Stage;
const globalObj = {};

const phoneScene = new Scene('phone');
phoneScene.enter(ctx => {
    return ctx.reply('Как с вами связаться?', Markup
        .keyboard([
            Markup.contactRequestButton('Мой телефонный номер'),
        ])
        .oneTime()
        .resize()
        .extra()
    )
});
phoneScene.on('message', ctx => {
    if (ctx.message.contact) {
        globalObj.phone = ctx.message.contact.phone_number;
        return ctx.scene.enter('start');
    }
    return ctx.reply('Как с вами связаться?', Markup
        .keyboard([
            Markup.contactRequestButton('Мой телефонный номер'),
        ])
        .oneTime()
        .resize()
        .extra()
    )
});

/**
 * Start Scene
 * @type {BaseScene}
 */

const startScene = new Scene('start');
startScene.enter(ctx => {
    globalObj.fullname = `${ctx.message.from.first_name || ""} ${ctx.message.from.last_name || ""}`;
    globalObj.chatId = ctx.message.chat.id;
    const time = moment.unix(ctx.update.message.date).format();
    const firstDay = moment(time).add(1, 'day').format('DD/MM/YYYY');
    const secondDay = moment(time).add(2, 'day').format('DD/MM/YYYY');
    startScene.action('day1', ctx => {
        globalObj.day = firstDay;
        ctx.scene.enter('day')
    });
    startScene.action('day2', ctx => {
        globalObj.day = secondDay;
        ctx.scene.enter('day')
    });
    return ctx.reply('когда вам удобно пройти собеседование: ', Extra.HTML().markup((m) =>
        m.inlineKeyboard([
            m.callbackButton(firstDay, 'day1'),
            m.callbackButton(secondDay, 'day2')
        ])))
});
startScene.on('message', ctx => ctx.reply('Выберите день'));

/**
 * Day Scene
 */
const dayScene = new Scene('day');
const time = ['утро', 'день', 'вечер'];
const ranges = [
    [10, 12],
    [13, 16],
    [16, 19]
];
function makeTwentyMinutes(i, type) {
    const from = moment(ranges[i][0].toString(), 'h').format();
    const till = moment(ranges[i][1].toString(), 'h').format();
    const range = moment.range(from, till);
    const hours = Array.from(range.by('minutes', { step: 20 })).map(one => one.format('HH:mm'));
    let j;
    const resultArr = [];

    return new Promise((resolve, reject) => {
        if (type) {
            return resolve(hours)
        }

        fs.readFile('client_secret.json', (err, content) => {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }

            // Authorize a client with the loaded credentials, then call the Google Sheets API.
            authorize(JSON.parse(content))
                .then(doc => {
                    getRows(doc, globalObj.day)
                        .then(doc => {
                            _.each(doc, one => {
                                const found = _.find(hours, two => one === two);
                                if (found) {
                                    hours.splice(hours.indexOf(found), 1);
                                }
                            });
                            hours.forEach(one => {
                                resultArr.push(Markup.callbackButton(one, one));
                            });
                            return resolve(_.chunk(resultArr, resultArr.length/3));
                        })
                        .catch(console.error)
                })
                .catch(console.error)
        });
    });

}

dayScene.enter((ctx) => {
    return ctx.reply('Выберите время суток', Extra.markup(m =>
        m.inlineKeyboard([
            m.callbackButton(time[0], time[0]),
            m.callbackButton(time[1], time[1]),
            m.callbackButton(time[2], time[2])
        ])))

});
dayScene.action(time, ctx => {
    globalObj.time = ctx.match;
    ctx.scene.enter('time');
});
dayScene.command('cancel', leave());
dayScene.on('message', (ctx) => ctx.reply('Выберите время суток'));

/**
 * Time Scene
 */
const timeScene = new Scene('time');
timeScene.enter(ctx => {
    makeTwentyMinutes(time.indexOf(globalObj.time), true)
        .then(doc => {
            timeScene.action(doc, ctx => {
                globalObj.hour = ctx.match;
                ctx.scene.leave();
            });
        }).catch(console.error);
    makeTwentyMinutes(time.indexOf(globalObj.time))
        .then(doc => {
            return ctx.reply('Выберите время суток',
                Markup
                    .inlineKeyboard(doc)
                    .extra()
            )
        })

});
timeScene.leave(ctx => {
    fs.readFile('client_secret.json', (err, content) => {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }

        // Authorize a client with the loaded credentials, then call the Google Sheets API.
        authorize(JSON.parse(content))
            .then(doc => {
                addRow(doc, [globalObj.day, globalObj.hour, null,
                    globalObj.fullname, globalObj.phone, null, null, 'В процессе', null, globalObj.chatId])
                    .then(doc => {
                        ctx.reply(`Вам назначено интервью ${globalObj.day} на ${globalObj.hour}`);
                        return ctx.replyWithLocation(55.738421, 37.663101);
                    })
                    .catch(console.error)
            })
            .catch(console.error)
    });
});
timeScene.on('message', ctx => ctx.reply('Выберите время пожалуйста'));

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage([startScene, dayScene, timeScene, phoneScene]);
bot.use(session());
bot.use(stage.middleware());
// bot.use(Telegraf.log());
bot.command('start', enter('phone'));

bot.on('message', ctx => ctx.reply('Для активации бота нажмите /start'));
bot.action(/.+/, ctx => ctx.reply('Для активации бота нажмите /start'));

bot.startPolling();