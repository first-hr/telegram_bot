const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const Moment = require('moment');
const MomentRange = require('moment-range');

const moment = MomentRange.extendMoment(Moment);
require('dotenv').config();
const { reply } = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);


// bot.use(Telegraf.log());

bot.command('start', ctx => {
    const time = moment.unix(ctx.update.message.date).format();
    const firstDay = moment(time).add(1, 'day').format('MM/DD/YYYY');
    const secondDay = moment(time).add(2, 'day').format('MM/DD/YYYY');

    bot.hears([`${firstDay}`, `${secondDay}`], ctx => {
        const time = ['утро', 'день', 'вечер'];
        const ranges = [
            [8, 12],
            [12, 16],
            [16, 20]
        ];

        function makeTwentyMinutes(i) {
            const from = moment(ranges[i][0].toString(), 'h').format();
            const till = moment(ranges[i][1].toString(), 'h').format();
            const range = moment.range(from, till);
            const hours = Array.from(range.by('minutes', { step: 20 }));
            return hours.map(m => m.format('HH:mm'));
        }

        bot.hears(time, ctx => {
            return ctx.reply('Выберите время', Markup
                .keyboard(makeTwentyMinutes(time.indexOf(ctx.update.message.text)))
                .oneTime()
                .resize()
                .extra()
            );
        });

        return ctx.reply('Выберите время суток', Markup
            .keyboard(time)
            .oneTime()
            .resize()
            .extra()
        );
    });

    return ctx.reply('когда вам удобно пройти собеседование: ', Markup
        .keyboard([firstDay, secondDay])
        .oneTime()
        .resize()
        .extra()
    );
});

/**
 * Error Handling
 */

bot.catch((err) => {
    console.log('Ooops', err)
});

bot.command('/start', (ctx) => ctx.reply('когда вам удобно пройти собеседование: '));
// bot.command('/oldschool', (ctx) => ctx.reply('Hello'));
// bot.command('/modern', ({ reply }) => reply('Yo'));
// bot.command('/hipster', reply('λ'));
// bot.on('text', ctx => ctx.reply('hey'));

bot.startPolling();

// bot.command('inline', (ctx) => {
//     return ctx.reply('<b>Coke</b> or <i>Pepsi?</i>', Extra.HTML().markup((m) =>
//         m.inlineKeyboard([
//             m.callbackButton('Coke', 'Coke'),
//             m.callbackButton('Pepsi', 'Pepsi')
//         ])))
// });
//
// bot.action('Dr Pepper', (ctx, next) => {
//     return ctx.reply('👍').then(() => next())
// });
//
// bot.action(/.+/, (ctx) => {
//     return ctx.answerCbQuery(`Oh, ${ctx.match[0]}! Great choice`)
// });