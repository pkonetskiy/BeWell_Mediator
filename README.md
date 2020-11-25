# Project 'BeWell Mediator' (version 0.19 alpha) 
> The project implements data exchange between SuiteCRM and some messengers.
>
> Project connects SuiteCRM with Hubot for data sending to messenger and consists of javascripts included into Hubot.
>
> The project has been tested with the next configuration:
>
> Rocket.chat(3.6.2)<->Hubot<->SuiteCRM(7.11.15)

## Possibilities

The project takes data from SuiteCRM which is queried by the user of messenger and after that the project shows the data to the user.

## The project includes files

- module-SuiteCRM.js - includes object receiving queries to bot.
- integration_SuiteCRM/integration.js - includes object and functions implementing the steps of request to SuiteCRM.
- integration_SuiteCRM/request.js - includes data processing object before and after requests to SuiteCRM.
- integration_SuiteCRM/query.js - includes filter processing object for parameter `query` of the method `get_entry_list` (API v4.1 Methods SuiteCRM)
- integration_SuiteCRM/config.js - includes object of configuration of this integration

## Installation and configuration

1. Configurate your messenger which supports Hubot. You can use any variants of messenger installation: cloud or local.
2. Configurate user in SuiteCRM for integration. You can use any variants of installation SuiteCRM: cloud or local.
3. Install Hubot (https://hubot.github.com/). Hubot use node.js, install it if necessary.
4. Configurate Hubot on your messenger.
5. Add package soap to Hubot (npm install soap). Soap is used in this project.
6. Copy files of the project to directory `script` of Hubot with saving of the structure.
7. Configurate file - integration_SuiteCRM/config.js . All comments and examples are in the file.

## Examples

The project includes 3 examples of requests to SuiteCRM.

- 'my companies by the week' (and several variants) - getting the list of my companies created by last 7 days.
- 'my open tasks' (and several variants) - getting the list of my tasks with status 'In Progress' in SuiteCRM.
- 'all open tasks' (and several variants) - getting the list of all tasks with status 'In Progress' in SuiteCRM.

## Features

Users of messenger and SuiteCRM should use equal names of users (login).

## Testing

You can test the project if you change parameters of object `server` in file integration_SuiteCRM/config.js only.

## Using

Messenger user writes the query that is equal to the regular expression in file config.js:

- in the privet channel with bot
- in general group where bot is included but with the direct appeal to bot (example: @bot my open tasks, where 'bot' is user name of bot)

## Progress

1. Creating new modules for SuiteCRM which makes the file config.js of this project through user interface of SuiteCRM.
2. Creating new records in SuiteCRM by query of users of messenger.
3. Editing present records in SuiteCRM by query of users of messenger.
4. Setting up clarifying questions for the messenger user in case of ambiguous queries.
5. Control the history of messenger users queries.
6. Creating polls. (It will be interesting for services companies.)