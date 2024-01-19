const authorization = {}

authorization.middleware = async function (request, response, next) {
    let headers = request.headers

    // Verify authorization header, otherwise return
    if (!headers["authorization"]) return response.status(400).send("Missing authorization header");
    if (headers["authorization"] !== process.env.api_key) return response.status(401).send("Invalid authorization header");

    next()
}

export default authorization;