// Initializing our clients object
const clients = {};

// Destructure our environmental variables
const {
  CFTOOLS_API_SECRET,
  CFTOOLS_API_APPLICATION_ID,
  CFTOOLS_SERVERS,
  UNRESOLVED_PLAYER_NAME
} = require('./config.json');

// export our CFTools clients as unnamed default
module.exports = clients;

// Get API token, valid for 24 hours, don't export function
const fetchApiToken = async () => {
  // Getting our token
  let token = await fetch(
    'https://data.cftools.cloud/v1/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({
        'application_id': CFTOOLS_API_APPLICATION_ID,
        secret: CFTOOLS_API_SECRET
      }),
      headers: { 'Content-Type': 'application/json' }
    }
  );
  token = (await token.json()).token;
  return token;
};

let CFTOOLS_API_TOKEN;
const tokenExpirationMS = 1000 * 60 * 60 * 23;
const getAPIToken = async () => {
  if (!CFTOOLS_API_TOKEN) {
    CFTOOLS_API_TOKEN = await fetchApiToken();
    // Update our token every 23 hours
    setInterval(async () => {
      CFTOOLS_API_TOKEN = await fetchApiToken();
    }, tokenExpirationMS);
  }
  return CFTOOLS_API_TOKEN;
};
module.exports.getAPIToken = getAPIToken;

const fetchPlayerDetails = async (cftoolsId, CFTOOLS_SERVER_API_ID = null) => {
  let data;
  try {
    data = await fetch(
      `https://data.cftools.cloud/v1/server/${CFTOOLS_SERVER_API_ID}/player?cftools_id=${cftoolsId}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${await getAPIToken()}` }
      }
    );
    data = (await data.json());
    return data;
  } catch (err) {
    console.log('Error encounter fetching player information');
    console.error(err);
    return err;
  }
};
module.exports.fetchPlayerDetails = fetchPlayerDetails;

// Tries to fetch player data from every server defined in config
const tryPlayerName = async (cftoolsId) => {
  // Properly set default
  let resolvedName = UNRESOLVED_PLAYER_NAME;

  // Loop over available configured servers
  for (const API_SERVER_ID of CFTOOLS_SERVERS) {
    // Make the request and make sure the response is OK
    const res = await fetchPlayerDetails(cftoolsId, API_SERVER_ID);
    if ( !res
      || res.status !== true
      || !res[cftoolsId]
    ) continue;

    // Check omega property
    const { omega } =  res[cftoolsId];
    if (!omega) continue;

    // Find and resolve latest name
    omega.name_history.reverse();
    const nameHistory = omega?.name_history;
    const latestName = nameHistory[0];
    if (latestName) {
      resolvedName = latestName;
      break; // Escape the for-loop
    }
  }

  // Always return the status
  return resolvedName;
};
module.exports.tryPlayerName = tryPlayerName;

const getBanListEntry = async (identifier, banListId) => {
  let data;
  try {
    data = await fetch(
      `https://data.cftools.cloud/v1/banlist/${ banListId }/bans?identifier=${ identifier }`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${ await getAPIToken() }` }
      }
    );
    data = (await data.json());
  }
  catch (err) {
    logger.syserr('Error encounter while getting ban entry');
    logger.printErr(err);
    data = null;
  }
  return data;
};
module.exports.getBanListEntry = getBanListEntry;
