const TelegramApi = require('node-telegram-bot-api')
const express = require('express');
const token = process.env.TOKEN;
const port = process.env.PORT || 3000; // Use Render's PORT environment variable

const app = express();

app.get('/', (req, res) => {
    res.send('Telegram bot is running!');
});

app.listen(port, () => {
    console.log(`Web server running on port ${port}`);
});
// const ownerChatId = 6091491638;
const ownerChatId = 450702453;

const bot = new TelegramApi(token, {polling: true})

const botCommands = [
    {command: '/start', description: 'В начало беседы.'}
];

bot.setMyCommands(botCommands)
    .then(() => {
        console.log('Bot commands have been set successfully.');
    })
    .catch((error) => {
        console.error('Error setting bot commands:', error);
    });


const restart = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Завершить диалог и вернуться в стартовое меню.', callback_data: '/again'}]
        ]
    })
}
const mainOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Выразить благодарность', callback_data: '/say_thanks'}],
            [{text: 'Задать вопрос по товару', callback_data: '/get_product_info'}],
            [{text: 'Проблема с товаром', callback_data: '/problem_product'}],
            [{text: 'Предложить улучшение', callback_data: '/suggest_improvement'}]
        ]
    })
}
const productGroupOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Масла', callback_data: '/oil'}],
            [{text: 'Шампуни', callback_data: '/shampoo'}],
            [{text: 'Бальзамы', callback_data: '/balm'}],
            [{text: 'Зубные пасты', callback_data: '/tooth_paste'}],
            [{text: 'Свечи', callback_data: '/candle'}]
        ]
    })
}
const productQueryOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{text: 'Прочитать инструкцию', callback_data: '/manual'}],
            [{text: 'Задать вопрос производителю', callback_data: '/ask'}]
        ]
    })
}
const messageMappings = new Map(); // Map owner message IDs to user chat IDs

bot.on('message', async (msg) => {
    console.log(msg);
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        await bot.sendSticker(
            chatId,
            'https://cdn.tlgrm.ru/stickers/348/e30/348e3088-126b-4939-b317-e9036499c515/1.webp'
        );
        await bot.sendMessage(
            chatId,
            `Добрый день, дорогой покупатель! Вы попали в чат обратной связи российского производителя натуральной продукции торговой марки DESANSHE. 
Пожалуйста, выберите интересующий вас пункт меню.`,
            mainOptions
        );
    } else if (chatId !== ownerChatId) {
        // Message from a user
        const userChatId = chatId;
        const userName =
            msg.from.username ||
            `${msg.from.first_name} ${msg.from.last_name || ''}`;
        let messageContent = `Message from ${userName} (ID: ${userChatId}):`;
        if (msg.text) {
            // Handle text messages with existing logic
            messageContent += `\n${msg.text}`;
            bot.sendMessage(ownerChatId, messageContent)
                .then((sentMessage) => {
                    messageMappings.set(sentMessage.message_id, userChatId);
                    console.log(messageMappings);
                })
                .catch((error) => {
                    console.error('Error sending message to owner:', error);
                });
            bot.sendMessage(userChatId, "Спасибо за обращение. В ближайшее время мы свяжемся с вами. " +
                "\nЕсли хотите - можете продолжить мысль или прикрепить файл." +
                "\nС уважением, команда DESANSHE", restart);
        } else if (msg.caption) {
            // The message is a media message with a caption
            // Send a separate message with the user's info and caption
            messageContent += `\ntext: ${msg.caption} \n file with text:`;
            bot.sendMessage(ownerChatId, messageContent)
                .then(() => {
                    console.log(`Sent caption message from user ${userChatId} to owner.`);
                })
                .catch((error) => {
                    console.error('Error sending caption message to owner:', error);
                })
                .then(() => {

                    // Forward the media message directly to the owner
                    bot.forwardMessage(ownerChatId, userChatId, msg.message_id)
                        .then(() => {
                            console.log(`Forwarded media message from user ${userChatId} to owner.`);
                        })
                        .catch((error) => {
                            console.error('Error forwarding message to owner:', error);
                        });
                });
            bot.sendMessage(userChatId, "Спасибо за обращение. В ближайшее время мы свяжемся с вами. " +
                "\nЕсли хотите - можете продолжить мысль или прикрепить файл." +
                "\nС уважением, команда DESANSHE", restart);

        } else {
            // The message is a media message without a caption
            // Forward the media message directly to the owner
            messageContent += `\n "Forwarded from \n${msg.from.first_name}"`;
            bot.sendMessage(ownerChatId, messageContent)
                .then(() => {
                    console.log(`Sent caption message from user ${userChatId} to owner.`);
                })
                .catch((error) => {
                    console.error('Error sending caption message to owner:', error);
                })
                .then(() => {
                    bot.forwardMessage(ownerChatId, userChatId, msg.message_id)
                        .then(() => {
                            console.log(`Forwarded media message from user ${userChatId} to owner.`);
                        })
                        .catch((error) => {
                            console.error('Error forwarding message to owner:', error);
                        });
                });
            bot.sendMessage(userChatId, "Спасибо за обращение. В ближайшее время мы свяжемся с вами. " +
                "\nЕсли хотите - можете продолжить мысль или прикрепить файл." +
                "\nС уважением, команда DESANSHE", restart);
        }
    } else {
        // Message from the owner

        // Message from the owner
        // Check if this message is a reply to another message that includes user ID
        if (
            msg.reply_to_message &&
            (msg.reply_to_message.text || msg.reply_to_message.caption) &&
            (msg.reply_to_message.text?.includes('(ID:') || msg.reply_to_message.caption?.includes('(ID:'))
        ) {
            const repliedText = msg.reply_to_message.text || msg.reply_to_message.caption;
            const idMatch = repliedText.match(/\(ID:\s*(\d+)\)/);

            if (idMatch && idMatch[1]) {
                const userChatId = parseInt(idMatch[1], 10);

                // Determine if the owner's message is text-only or a file
                const isTextOnly =
                    msg.text &&
                    !msg.photo &&
                    !msg.document &&
                    !msg.video &&
                    !msg.voice &&
                    !msg.audio &&
                    !msg.sticker &&
                    !msg.animation;

                if (isTextOnly) {
                    // Existing logic for text messages
                    // Send text directly to the user as a normal message
                    bot.sendMessage(userChatId, msg.text, restart)
                        .then(() => {
                            console.log(`Sent owner's text reply to user ${userChatId}`);
                        })
                        .catch((error) => {
                            console.error('Error sending text message to user:', error);
                        });
                } else {
                    // It's a file message (photo, document, etc.)
                    // Directly forward the owner's message to the user
                    bot.forwardMessage(userChatId, ownerChatId, msg.message_id, restart)
                        .then(() => {
                            console.log(`Forwarded file message from owner to user ${userChatId}`);
                        })
                        .catch((error) => {
                            console.error('Error forwarding message to user:', error);
                        });
                }
            } else {
                console.log('Could not extract user ID from the replied message.');
            }
        } else {
            console.log('Message from owner is not a reply to a user message with ID.');
        }
    }
});

bot.on('callback_query', (msg) => {
    console.log(msg);
    const data = msg.data;
    const chatId = msg.message.chat.id;
    if (data === '/get_product_info') {
        bot.sendMessage(
            chatId,
            `Выберите интересующую группу товаров:`,
            productGroupOptions
        );
    } else if (data === '/say_thanks' || data === '/problem_product' || data === '/suggest_improvement') {
        bot.sendMessage(
            chatId,
            'Пожалуйста, напишите ваше сообщение. При необходимости, прикрепите фото и видео. Мы обязательно ответим вам как можно быстрее.'
        );
    } else if (data === '/manual') {
        const message = 'Подробную инструкцию вы найдете [по адресу](http://telegra.ph/).';
        bot.sendMessage(chatId, message, {parse_mode: 'Markdown'});
    } else if (data === '/again') {
        bot.sendMessage(
            chatId,
            `Диалог завершён. Благодарим Вас!\nПожалуйста, выберите интересующий вас пункт меню:`,
            mainOptions
        );
    } else if (data === '/ask') {
        bot.sendMessage(
            chatId,
            'Пожалуйста, напишите ваше сообщение. При необходимости, прикрепите фото и видео. Мы обязательно ответим вам как можно быстрее.'
        );
    } else {
        bot.sendMessage(
            chatId,
            `Выберите опцию:`,
            productQueryOptions
        );
    }
});