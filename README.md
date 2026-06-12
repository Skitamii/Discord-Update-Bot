# 🎮 Discord Update Bot

Discord Update Bot using RSS feeds and scraper to send update to user/channel based on the subscription

## 📋 Requirements

- Node.js 18+ 
- npm or yarn
- A discord bot

## ❔ How does the bot work

As for now, you need to add (admin) some feeds you want to check on the app.

Next, while you type "/subscribe", you automatically subscribe to the feed from where you type the command :
- Private message: You will receive the update feed from private message
- Channel: You will receive the update feed from the channel you subscribe to

You can subscribe in private message and on multiple channel, there is no restriction.

## 🚀 Installation

### 1. Clone the project

```bash
git clone <repo>
cd Discord-Update-Bot
```
### 2. Install project

```bash
npm install
```

### 3. Setup .env file

### 3.1 Get your application ID

Go to [Discord applications](https://discord.com/developers/applications) and create a New Application
Then add your Application ID from your bot to you .env file
![Image of Discord Application ID location](https://skitami.fr/static/img/discordApplicationID.png)

### 3.2 Get your Bot Token

On the "Bot" section, you need your Bot Token
![Image of Discord Bot Token location](https://skitami.fr/static/img/discordBotToken.png)

### 3.3 Get your User ID

Then you need your User ID (for admin commands)
You can check this [Where can I find my User/Server/Message ID?](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID)

### 4. Init and start project

```bash
npm run build
npm run setup
npm run deploy-commands # deploy commands every time you add a new one in ./src/commands folder
npm run start
```
## ⌨ How to use

### 1. Admin commands add/edit/delete

```
- Add: Add a feed (admin)
    - *feedname: Feed name (used as display name)
    - *url: URL of the feed (there is check for RSS feed URL)
    - thumbnail: URL for thumbnail of the feed (There is a check for Thumbnail URL)
    - embedColor: Color of the Embed (with or without "#", make one by default)
```

```
- Delete: Delete a feed (admin)
    - *feedname: Feed name
```

```
- Edit: Edit a feed (admin)
    - *feedname: Feed name
    - disabled: Enable or disable the feed
    - newfeedname: New feed name (ex if you want to change display name)
    - url: URL of the feed
    - thumbnail: URL for thumbnail of the feed
    - embedColor: Color of the Embed
```

### 2. Commands

```
- List: Get a list of all feeds available
```

```
- Subscribe: Subscribe to a feed
    - *feedname: feed name to subscribe
```

```
- Subscribed: Get what feed you have subscribed
```

```
- Unsubscribe: Unsubscribe to a feed
    - *feedname: feed name to unsubscribe
```

```
- Update: Force feed and get the last update
    - *feedname: feed name to update
    - ephemeral: true = only visible by you (default true)
```

```
- Summarize: Summarize an update (step by step)
```

## ✅ To do list

- [x] Move to Typescript
- [x] Add IA to summarize updates
- [x] Add templates example for scraping updates
- [ ] Change the way of "/update" work (check all updates)
- [ ] Maybe add to embed message all images as attachment
- [ ] Change contentSnippet to content to embed messages

## ❓ FAQ
```
❓ I want to add an update who not have a rss feeds, how to do it ?
✅ That's why I have created scraper, but you need some javascript skills to get articles and content of the update (please refer to example inside "scrapers" folder).
- First use "axios" and "cheerio" (lolPatchNotes), and if the url don't let you get the html (like Rocket League), use playwright as example with Rocket League
```
```
❓ I added my own scraper, how to add on the bot ?
✅ Simply add it with the command "/add feedname: SameNameAsFile url: any (it take it from the file), or restart the app"
```
```
❓ I don't have a display/GUI to let work playwright on ubuntu, what to do ?
✅ Check "Xvfb" module for ubuntu
```
```
❓ There is a bug on this app !
✅ Please, open an issues, i'll try to do my best
```