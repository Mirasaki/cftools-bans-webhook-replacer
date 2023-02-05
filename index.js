// Import dependencies
const { Client, GatewayIntentBits, Events } = require("discord.js");
const { tryPlayerName } = require("./cftClient");
const { existsSync } = require('fs');

// Make sure the configuration file exists
if (!existsSync('./config.json')) {
  console.log('Missing "config.json" file. Rename "config.example.json" to "example.json" and configure your values.');
  console.log('You should really take a look at the README.md file')
  process.exit(1);
}

// Assign config variables
const config = require('./config.json');
const {
  DISCORD_BOT_TOKEN,
  CFTOOLS_WEBHOOK_CHANNEL_ID,
  CFTOOLS_WEBHOOK_USER_ID,
  CFTOOLS_DELETE_ORIGINAL_MESSAGE,
  DISCORD_EMBED_COLOR,
  DISCORD_EMBED_TITLE,
  _DISCORD_EMBED_ICON_URL,
  UNRESOLVED_PLAYER_NAME,
  DEFAULT_BAN_REASON,
  CFTOOLS_API_SECRET,
  CFTOOLS_API_APPLICATION_ID,
  CFTOOLS_SERVERS,
  _USE_CUSTOM_EMBED_STRUCTURE,
  _CUSTOM_EMBED_STRUCTURE,
  _CFTOOLS_WEBHOOK_REGEX_MATCH
} = config;

// Create discord client
const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
] });

// Define our main function
const main = async () => {
  // Validate config before doing anything
  validateConfig();

  // Log in to our discord bot client/bot
  await client.login(DISCORD_BOT_TOKEN);
  client.on(Events.ClientReady, () => console.log(`Client online and responsive as ${client.user.tag}`));

  // Register message listener
  client.on(Events.MessageCreate, async (msg) => {
    // Assignments
    const { channel, webhookId, content } = msg;

    // Validate target ids/is ban message
    if (
      channel?.id !== CFTOOLS_WEBHOOK_CHANNEL_ID
      || webhookId !== CFTOOLS_WEBHOOK_USER_ID
    ) return;

    // Conditionally customizable regex
    let regex = /(got banned on)|:/;
    if (_CFTOOLS_WEBHOOK_REGEX_MATCH && _CFTOOLS_WEBHOOK_REGEX_MATCH.length >= 1) regex = new RegExp(regex);
    
    // Destructure from regexp split
    // Reference Template: {{ identifier }} got banned on {{ banlist_identifier }}: {{ reason }}
    const [
      cftoolsId,
      _regExpMatch,
      banListIdentifier,
      banReason
    ] = content
      .split(regex) // Split the content on our predefined regexp
      .filter((e) => e && typeof e === 'string') // Only truthy values
      .map((e) => e.trim()); // Trim the string (removed additional whitespace at front & back)

    // Assignments
    const ign = await tryPlayerName(cftoolsId);
    const cftoolsProfileLink = `https://app.cftools.cloud/profile/${cftoolsId}`;
    const profileHyperLink = `[${ ign }](${ cftoolsProfileLink })`;
    const reason = banReason || DEFAULT_BAN_REASON;

    // Resolve HEX color integer
    let color = DISCORD_EMBED_COLOR.slice(1);
    if (color.length < 6) color = `${color}${color.charAt(0).repeat(6 - color.length)}`;
    color = parseInt(color, 16);

    // Structure available tags _CUSTOM_EMBED_STRUCTURE
    const availableTags = {
      ign,
      cftoolsProfileLink,
      profileHyperLink,
      banListIdentifier,
      reason
    }

    // Construct our embed object
    const banEmbed = _USE_CUSTOM_EMBED_STRUCTURE
      ? replaceStringTags( _CUSTOM_EMBED_STRUCTURE, availableTags)
      : {
          color,
          author: {
            name: DISCORD_EMBED_TITLE,
            iconURL: _DISCORD_EMBED_ICON_URL ? _DISCORD_EMBED_ICON_URL : null
          },
          fields: [
            {
              name: 'Profile',
              value: profileHyperLink,
              inline: true
            },
            {
              name: 'Ban Manager',
              value: banListIdentifier
            },
            {
              name: 'Reason',
              value: `\`\`\`\n${reason}\n\`\`\``
            }
          ]
        }

    // Wait for our message delivery
    await channel
      .send({ embeds: [ banEmbed ] })
      .catch((err) => console.error(err.message));

    // Conditionally delete the original message afterwards
    if (CFTOOLS_DELETE_ORIGINAL_MESSAGE) {
      msg.delete().catch((e) => {
        // Continue silently on outages and
        // when we don't have permission to delete the message
      });
    }
  });
}

// Returns a new object with all possible string tags replaced with their values
const replaceStringTags = (
  obj,
  replacers
) => {
  const newObj = {};
  for (const [ key, value ] of Object.entries(obj)) {
    let newVal;
    switch (typeof value) {
      case 'string': {
        let newStr = value;
        for (const [k,v] of Object.entries(replacers)) newStr = newStr.replaceAll(`{{${k}}}`, v);
        newVal = newStr;
        break;
      }
      case 'object': {
        if (Array.isArray(value)) newVal = value.map((e) => replaceStringTags(e, replacers));
        else newVal = replaceStringTags(value, replacers);
        break;
      }
      default: newVal = value;
    }
    newObj[key] = newVal;
  }
  return newObj;
}

// Validate our expected config
const validateConfig = () => {
  const problems = [];
  // Loop over our expected config key-value pairs to validate them
  for (const [ key, value ] of Object.entries({
    DISCORD_BOT_TOKEN,
    CFTOOLS_WEBHOOK_CHANNEL_ID,
    CFTOOLS_WEBHOOK_USER_ID,
    CFTOOLS_DELETE_ORIGINAL_MESSAGE,
    DISCORD_EMBED_COLOR,
    DISCORD_EMBED_TITLE,
    _DISCORD_EMBED_ICON_URL,
    UNRESOLVED_PLAYER_NAME,
    DEFAULT_BAN_REASON,
    CFTOOLS_API_SECRET,
    CFTOOLS_API_APPLICATION_ID,
    CFTOOLS_SERVERS,
    _CFTOOLS_WEBHOOK_REGEX_MATCH
  })) {
    const isOptional = key.startsWith('_');
    if ( // Validate key-value pair if not optional
      !isOptional
      && ( // Check is truthy value
        typeof value === 'undefined'
        || (( // Check length on str and arr
          typeof value === 'string'
          || Array.isArray(value)
        ) && value.length < 1)
      )
    ) problems.push(`Missing "${key}" value in /config.json`);
  }

  // Exit, if at least 1 problem is found
  if (problems[0]) {
    for (const problem of problems) console.error(problem);
    console.log('Invalid config, exiting...');
    process.exit(1);
  }
}

main();
