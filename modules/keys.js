import database from "./database.js";
import logger from "./logger.js";

const keys = {};

keys.register = async function(request, result) {
    let data = request.body;

    if (await database.findRbxOCM(data)) {
        logger.error(`[${data["key"]}] already registered.`);
        result.status(401).send(`[${data["key"]}] already registered.`);
        return;
    }

    await database.sendRbxOCM(data);
    logger.success(`[${data["key"]}] successfully registered.`);
    result.send("success");
}

export default keys;