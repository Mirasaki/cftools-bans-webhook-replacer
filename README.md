# cftools-bans-webhook-replacer

This is a NodeJS application that parses data from the free CFTools webhook and replaces it with a custom embed message with minimal dependencies. Fetches additional information from the CFTools API to try and resolve the latest in-game player name.

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)
    1) Head over to the download page
    2) Download the latest LTS available for your OS
    3) Be sure to check the box that says "Automatically install the necessary tools" when you're running the installation wizard
- A [Discord Bot account](https://discord.com/developers/applications)
    1) Head over to the page linked above
    2) Click "New Application" in the top right
    3) Give it a cool name and click "Create"
    4) Click "Bot" in the left hand panel
    5) Click "Add Bot" -> "Yes, do it!"
    6) Click "Reset Token" and copy it to your clipboard, you will need it later

## Installation

1. Download and extract the [latest release](https://github.com/Mirasaki/cftools-bans-webhook-replacer/releases)
2. Open a command prompt/bash/shell in the newly created folder
3. Run the `npm install` command to install all dependencies
4. Rename `/config.example.json` to `config.json` and fill in your values, see [configuration](#configuration)
5. Add the bot to your server by using the following link: (Replace CLIENT-ID with your CLIENT_ID from before) <https://discord.com/api/oauth2/authorize?client_id=CLIENT-ID&permissions=26624&scope=bot>
6. Run the command `node .` in the project root folder/directory or `npm run start` if you have [PM2](https://pm2.keymetrics.io/) installed to keep the process alive.

## Configuration

- ❗This is **not** valid JSON, only a reference. Don't copy-paste and use this. ❗
- Optional values start with an underscore (`_`)

```json
{
  // Can be grabbed by creating a new application in [your Discord Developer Portal](https://discord.com/developers/applications)
  // After creating your bot on the link above, navigate to `Bot` in the left-side menu to reveal your bot-token
  "DISCORD_BOT_TOKEN": "your_token",

  // Application ID from your [CFTools Developer Apps](https://developer.cftools.cloud/applications)
  // Authorization has to be granted by navigating to the `Grant URL` that's displayed in your app overview
  "CFTOOLS_API_APPLICATION_ID": "your_application_id",
  // Same as above, click `Reveal Secret`
  "CFTOOLS_API_SECRET": "your_secret",
  // Array of API_SERVER_ID's to try and resolve the in-game name from
  // Click `Manage Server` in your CF Cloud Panel (https://app.cftools.cloud/dashboard)
  // `Settings` > `API Key` > `Server ID`
  "CFTOOLS_SERVERS": [
    "API_SERVER_ID_1",
    "API_SERVER_ID_2"
  ],

  // Id of the channel where the CFTools webhook sends it messages
  // Right-click in Discord developer mode
  "CFTOOLS_WEBHOOK_CHANNEL_ID": "806479539110674472",
  // Id of the webhook user - once again, right-click the user in Discord developer mode
  "CFTOOLS_WEBHOOK_USER_ID": "290182686365188096",
  // Should the original message be deleted?
  "CFTOOLS_DELETE_ORIGINAL_MESSAGE": true,

  // HEX value of the Discord embed color
  "DISCORD_EMBED_COLOR": "#121212",
  // Title of replacement embed
  "DISCORD_EMBED_TITLE": "Player Banned",
  // Optional image url to display on the embed, leave empty if none
  "_DISCORD_EMBED_ICON_URL": "",

  // Player name to display when we can't resolve any in-game names
  "UNRESOLVED_PLAYER_NAME": "Survivor",
  // Default reason output when none is provided
  "DEFAULT_BAN_REASON": "Not provided",

  // C'mon man. I don't like how it looks 😮‍💨
  // Alright. Be my guest. Available message tags:
  // {{ign}}                - Latest in game name for the banned player
  // {{cftoolsProfileLink}} - URL of the banned player's CFTools profile
  // {{profileHyperLink}}   - Pre-formatted Discord hyperlink of the player's CFTools profile
  // {{banListIdentifier}}  - Id of the CFtools ban-manager
  // {{reason}}             - The reason provided, [[DEV]]

  // Should we use the custom embed
  "_USE_CUSTOM_EMBED_STRUCTURE": false,
  // Raw Discord API embed data
  "_CUSTOM_EMBED_STRUCTURE": {
    "color": 12526,
    "author": {
      "name": "Player Banned",
      "iconURL": "https://example.com/image.png"
    },
    "description": "{{ign}} | {{cftoolsProfileLink}} | {{profileHyperLink}} | {{banListIdentifier}} | {{reason}}",
    "fields": [
      {
        "name": "Profile",
        "value": "{{profileHyperLink}}",
        "inline": true
      },
      {
        "name": "Ban Manager",
        "value": "{{banListHyperIdentifier}}"
      },
      {
        "name": "Reason",
        "value": "```\n{{reason}}\n```"
      }
    ]
  },

  // Dangerous! Customization of the regex
  // Should resolve to the following array after splitting the
  // message based on this regex: (falsy values are filtered out)
  // [ cftoolsId, _regExpMatch, banListIdentifier, reason ]
  "_CFTOOLS_WEBHOOK_REGEX_MATCH": "/(got banned on)|:/"
}
```

## License

[MIT](https://choosealicense.com/licenses/mit/)

> That means you can do whatever you want with this =)
