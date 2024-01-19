const database = {}

import { MongoClient } from 'mongodb';
import axios from 'axios';

const sleep = ms => new Promise(r => setTimeout(r, ms));

let mongo_url, mongo_name, mongo_client;

database.init = async function() {
    mongo_url = `mongodb://${process.env.mongodb_user}:${process.env.mongodb_pass}@1${process.env.mongodb_url}:${process.env.mongodb_port}`;
    mongo_name = "roblox";
    mongo_client = new MongoClient(mongo_url);
    return mongo_client;
}

database.findRbxOCM = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("rbx_ocm_apikey");

    const found_data = await collection.findOne({short_name: data["rbx_ocm_apikey"]});

    if(!found_data) return false;

    return found_data;
}

database.findRequestMatching = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("request_matching");

    const found_data = await collection.findOne({request_ident: data["request_ident"]});

    if(!found_data) return false;

    return found_data;
}

database.updateRequest = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("request_matching");

    await collection.updateOne({request_ident: data["request_ident"]}, {$set: data});
}

database.updateServer = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("server");

    await collection.updateOne({_id: data["server_id"]}, {$set: data});
}

database.sendServer = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("server");

    data["status"] = data["event"];
    data["_id"] = data["server_id"];

    await collection.insertOne(data);
}

database.sendPlayer = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("player");

    await collection.insertOne(data);
}

database.sendPurchase = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("purchases");

    await collection.insertOne(data);
}

database.sendRbxOCM = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("rbx_ocm_apikey");

    await collection.insertOne(data);
}

database.requestMatching = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("request_matching");

    await collection.insertOne(data);

    // Because ROBLOX doesn't support setting custom responses to get requests using OCM,
    // we have to use a somewhat janky solution of waiting and seeing if MongoDB receives
    // an identical object but with a "status" variable of "done".
    let iterate = 0;

    while (iterate < 10) {
        if (await collection.findOne({request_ident: data["request_ident"], status: "done"})) {
            return collection.findOne({request_ident: data["request_ident"], status: "done"});
        }
        iterate++;
        await sleep(1000);
    }

    return {
        status: "error",
        response: { "error": "no match" }
    }
}

database.returnPlayer = async function(player, headers, data) {
    await mongo_client.connect();


    const server_collection = mongo_client.db(mongo_name).collection("server");
    let found_server = await server_collection.findOne({players: {$in: [player]}});

    if (!found_server) {
        return {"status": "error", "response": {"error": "player_not_in_server"}}
    }

    let player_request = await axios({
        url: `https://catbot.kittie.link/serveto/?server=${found_server["_id"]}`,
        method: "post",
        data: {
            "rbx_ocm_apikey": data["rbx_ocm_apikey"],
            "body": {
                "event": "returnplayer",
                "arguments": {
                    "player": player
                }
            }
        },
        headers: {"authorization": headers["authorization"]}
    });

    return player_request.data.response;
}

database.returnServer = async function(rbx_ocm_apikey, server_id) {
    await mongo_client.connect();

    const server_collection = mongo_client.db(mongo_name).collection("server");

    return await server_collection.findOne({_id: server_id, rbx_ocm_alias: rbx_ocm_apikey});
}

database.returnGame = async function(authorization, rbx_ocm_apikey) {
    await mongo_client.connect();

    const rbx_ocm_collection = mongo_client.db(mongo_name).collection("rbx_ocm_apikey");

    return await rbx_ocm_collection.findOne({short_name: rbx_ocm_apikey});
}

database.return_servers = async function(short_name) {
    await mongo_client.connect();

    return await mongo_client.db(mongo_name).collection('server').find({rbx_ocm_alias: short_name}).toArray();
}

database.return_games = async function(authorization) {
    await mongo_client.connect();

    return await mongo_client.db(mongo_name).collection('rbx_ocm_apikey').find().toArray();
}

database.removeServer = async function(data) {
    await mongo_client.connect();

    const collection = mongo_client.db(mongo_name).collection("server");

    await collection.deleteOne({_id: data["server_id"]});
}

export default database;