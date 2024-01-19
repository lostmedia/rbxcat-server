import logger from "./logger.js";
import {v4 as uuidv4} from "uuid";
import database from "./database.js";

const rbx_ocm = {};

rbx_ocm.serveFrom = async function(request, result) {
    let data = request.body

    let return_object;
    return_object = data;
    return_object["timestamp"] = new Date().toISOString();

    logger.info(JSON.stringify(return_object));

    // check for requestident
    let found_in_base = await database.findRequestMatching(return_object);

    if (found_in_base) {
        logger.info(`[${data["request_ident"]}] found in base. Updating now.`)
        await database.updateRequest(return_object);
    }

    result.send(return_object);
}

rbx_ocm.serveTo = async function(json) {
    let request_ident = uuidv4();

    let send_to = `https://apis.roblox.com/messaging-service/v1/universes/${json["universe_id"]}/topics/${json["server_id"]}`;
    json["body"]["request_ident"] = request_ident; // for match-ups

    let new_json = {"message": {}}
    new_json.message = JSON.stringify(json["body"]);

    let response = database.requestMatching(json["body"]);

    await fetch(send_to, {
        method: "POST",
        body: JSON.stringify(new_json),
        headers: {"Content-Type": "application/json", "x-api-key": json["rbx_ocm_apikey"]}
    });

    return response;
}

export default rbx_ocm;