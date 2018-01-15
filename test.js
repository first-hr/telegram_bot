const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Extra = require('telegraf/extra');
const Moment = require('moment');
const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(Moment);
const { enter, leave } = Stage;
require('dotenv').config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// Greeter scene
const start = new Scene('start');
const second = new Scene('second');
start.enter((ctx) => {
    const time = moment.unix(ctx.update.message.date).format();
    const firstDay = moment(time).add(1, 'day').format('MM/DD/YYYY');
    const secondDay = moment(time).add(2, 'day').format('MM/DD/YYYY');
    return ctx.reply('когда вам удобно пройти собеседование: ', Extra.HTML().markup((m) =>
        m.inlineKeyboard([
            m.callbackButton(firstDay, 'day'),
            m.callbackButton(secondDay, 'day')
        ])))
});

start.leave(ctx => ctx.scene.enter('second'));

second.enter(ctx => {
    const time = ['утро', 'день', 'вечер'];
    return ctx.reply('Выберите время суток', Extra.HTML().markup((m) =>
        m.inlineKeyboard([
            m.callbackButton(time[0], 'time'),
            m.callbackButton(time[1], 'time'),
            m.callbackButton(time[2], 'time')
        ])))
});

second.leave(ctx => ctx.reply('good'));
start.action('day', leave());
second.action('time', leave());
second.on('good', leave());

// Create scene manager
const stage = new Stage();
// Scene registration
stage.register(start);
stage.register(second);

bot.use(session());
bot.use(stage.middleware());

bot.command('start', (ctx) => ctx.scene.enter('start'));
bot.command('cancel', leave());
bot.on('message', ctx => ctx.replyWithMarkdown('Please type /start'));
bot.startPolling();