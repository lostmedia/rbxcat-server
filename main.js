//ill think of a lyric tomorrow probably
// im watching young sheldon rn

// Imports
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from './modules/logger.js';
import authorization from './modules/authorization.js';
import database from './modules/database.js';
import rbx_ocm  from './modules/rbx_ocm.js';
import keys from './modules/keys.js';
import cors from 'cors';

// Set up Express server
const app = express()
const port = 3000
const corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(express.json())
app.use(cors(corsOptions))
app.enable('trust proxy')
app.listen(port, () => {
    logger.success(`Express success! Listening on port ${port}.`)
})

// Connect to mongodb instance
let mongodb_client;
try {
    // noinspection JSIgnoredPromiseFromCall
    mongodb_client = await database.init();
} catch(e) {
    logger.error(e)
}

// Execute auth middleware
app.use(await authorization.middleware);

//rbx-opencloudmessaging support
app.post('/servefrom/', async(request, result)  => {
    await rbx_ocm.serveFrom(request, result);
});

app.post('/serveto/', async (request, result) => {
    let data = request.body;
    data["server_id"] = request.query.server;

    let response = await rbx_ocm.serveTo(data);
    result.send(response);
});

// api.your.link/database/player/player_name
// with headers authorization and data of {"rbx_ocm_apikey": "short_name"}
app.get('/database/player/:name', cors(corsOptions), async(request, result) => {
    let data = request.body;
    let headers = request.headers;

    let return_object;
    return_object = data;
    return_object["timestamp"] = new Date().toISOString();

    return_object["response"] = await database.returnPlayer(request.params.name, headers, data)

    result.send(return_object);
});

//api.your.link/database/game/${rbx_ocm_apikey (short name) or "all"}
app.get('/database/game/:id', cors(corsOptions), async (request, result) => {
    let data = request.body;
    let headers = request.headers;
    logger.info("game request sent");

    let auth_header = headers["authorization"];

    let return_object;
    return_object = data;
    return_object["timestamp"] = new Date().toISOString();

    if (request.params.id === "all") {
        return_object["response"] = await database.return_games(auth_header);

        result.send(return_object);
        return;
    }

    return_object["response"] = await database.returnGame(auth_header, request.params.id);
    result.send(return_object);
});

//api.kittie.link/database/server/58ff1440-6663-450c-9c3c-71195ccd3e8b
app.get('/database/server/:id', cors(corsOptions), async(request, result) => {
    let data = request.body;
    let rbx_ocm_apikey = data["rbx_ocm_apikey"];

    let return_object;
    return_object = data;
    return_object["timestamp"] = new Date().toISOString();

    if (request.params.id === "all") {
        return_object["response"] = await database.return_servers(rbx_ocm_apikey);

        result.send(return_object);
        return;
    }
    return_object["response"] = await database.returnServer(rbx_ocm_apikey, request.params.id);

    result.send(return_object);
});

/*
  will be called with a post request with the data:
  { "key": "SDUIMfvokSFEjsIGVnuis./*(", "short_name": "test"}

  note: you will now call any ServeTo post request with your short_name
*/

app.post('/register-ocm', async (request, result) => {
    await keys.register(request, result);
});

app.post('/server', async (request, result) => {
    let data = request.body

    let return_object
    return_object = data
    return_object["timestamp"] = new Date().toISOString();

    // Add extra data to return_object
    if (data["extra"]) {
        for (const [key, value] of Object.entries(data["extra"])) return_object[key] = value

        delete return_object["extra"]
    }

    // Handle events
    switch(data["event"]) {
        case "request":
            return_object["server_status"] = "requesting_id";
            return_object["server_id"] = uuidv4()
            result.send(return_object);
            logger.info(`[${return_object["server_id"]}] Server requested a server id, we gave them one.`);
            await database.sendServer(return_object);
            break;

        case "closed":
            return_object["server_status"] = "closed";
            result.send(return_object);
            logger.success(`[${data["server_id"]}] Server closed.`);
            await database.removeServer(return_object);
            break;

        case "update":
            return_object["server_status"] = "open";
            result.send(return_object);
            logger.success(`[${data["server_id"]}] Server updated.`);
            await database.updateServer(return_object);
            break;

        default:
            return_object["server_status"] = "open";
            logger.success(`[${data["server_id"]}] Server sent a ${data["event"]} event.`);
            result.send(return_object);
            await database.updateServer(return_object);
            break;
    }
});

app.post('/user', async (request, result) => {
    let data = request.body;

    let return_object;
    return_object = data
    return_object["timestamp"] = new Date().toISOString();

    if (data["extra"]) {
        for (const [key, value] of Object.entries(data["extra"])) return_object[key] = value

        delete return_object["extra"]
    }

    // handling special events (ie purchase)
    switch(data["event"]) {
        case "purchase":
            logger.info(`[${data["server_id"]}] [${return_object["player"]}] User purchased a ${return_object["product"]} ${return_object["type"]} for ${return_object["cost"]}.`);
            result.send(return_object);
            await database.sendPurchase(return_object);
            return;
    }

    logger.success(`[${data["server_id"]}] User [${data["player"]}] sent a ${data["event"]} event.`);
    result.send(return_object);
    await database.sendPlayer(return_object);
});