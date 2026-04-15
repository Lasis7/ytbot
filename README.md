# Banger Bot

## Introduction

A simple Discord jukebox bot (I'm sure you have seen a bunch of these).

This is the first Discord bot I've ever made. The idea for it came from the need of having a bot that could play Youtube music through a Discord bot. The idea is also fairly common for a first practical project, so it made sense from the get go.

## Requirements

The complete guide for setting up the bot on webfront can be found in [discord.js's guide](https://discordjs.guide/legacy/preparations/app-setup)

The bot has couple requirements before it can be used:

1. The bot needs to be set up on [Discord developer portal](https://discord.com/developers/applications)

- Name, avatar, etc.
- Create an invite link with appropriate permissions (OAuth2-page)

2. The bot uses .env file for sensitive data. Add these environmental variables

- DISCORD_TOKEN (bot's token)
- CLIENT_ID (bot's client id)
- GUILD_ID (the guild's id you want to use the bot in)
- OWNER_ID (bot's owner's id)

3. You need to install [yt-dlp](https://github.com/yt-dlp/yt-dlp) and [ffmpeg](https://ffmpeg.org/download.html) and add them to Path (I had both of them in the same folder because yt-dlp uses ffmpeg anyways)

## Start

To start the bot, just type _node bot.js_ in console.

## Other Notable Things

Please note that this bot is meant to be used on a singular Discord server. It uses Node.js child processes to spawn yt-dlp and ffmpeg, which means that it also needs to be run locally. The reason for spawning the processes instead of using third party libraries made for downloading and streaming from Youtube is that Youtube keeps changing their initial mechanism, which leads to these aforementioned libraries breaking down frequently. Because of this, using yt-dlp and ffmpeg directly is generally more robust and easier to maintain in the long term.

You may easily customize some parts of the bot, like images in queue.js and bot listening activity in loginReady.js. I wouldn't touch the most parts of the code unless you know what you are doing (if you were able to set all this up, I assume you do though lol).
