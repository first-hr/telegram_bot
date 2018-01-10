const Telegraf = require('telegraf');
require('dotenv').config();
const { reply } = Telegraf;

const bot = new Telegraf(process.env.BOT_TOKEN);
// bot.use(async (ctx, next) => {
//     console.log(ctx);
//     const start = new Date();
//     await next();
//     const ms = new Date() - start;
//     console.log('Response time %sms', ms);
// });

/**
 * Error Handling
 */

bot.catch((err) => {
    console.log('Ooops', err)
});

bot.command('/start', (ctx) => ctx.reply('когда вам удобно пройти собеседование: '));
bot.command('/oldschool', (ctx) => ctx.reply('Hello'));
bot.command('/modern', ({ reply }) => reply('Yo'));
bot.command('/hipster', reply('λ'));
bot.on('text', ctx => ctx.reply('hey'));

bot.startPolling();