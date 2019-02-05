const heimdall = (handler, options) => {
  return async (event, context, callback) => {
    let result = {};
    let statusCode = 200;

    let response = eventToResponse(event);
    let request = eventToRequest(event);

    try {
      result = await handler(request, response, event);
    } catch (error) {
      statusCode = error.statusCode || 500;

      result = { message: error.message };
    }

    callback(null, makeResponse(statusCode, result));
    return;
  };
};

const eventToRequest = event => {
  let method = event.method;
  let params = event.queryStringParameters;
  let headers = event.headers;
  let body = event.body;

  try {
    body = JSON.parse(event.body);
  } catch (e) {}

  return {
    method,
    params,
    parameters: params,
    headers,
    body,
    checkParameters: checkParameters
  };
};

const eventToResponse = event => {
  return event;
};

const makeResponse = (statusCode, body) => {
  return {
    statusCode: statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
};

const checkParameters = (object = {}, parameters) => {
  let keys = Object.keys(object) || [];
  keys = keys.map(k => k.toLowerCase());

  for (const param of parameters) {
    if (!keys.includes(param.toLowerCase())) {
      throw new MissingParameterError(param);
    }
  }
};

class ClientError extends Error {
  constructor(message, statusCode = 400) {
    super(message);

    this.name = "ClientError";
    this.statusCode = statusCode;
  }
}

class ServerError extends Error {
  constructor(message, statusCode = 500) {
    super(message);

    this.name = "ServerError";
    this.statusCode = statusCode;
  }
}

class MissingParameterError extends ClientError {
  constructor(parameterName) {
    super(`Missing parameter '${parameterName}'`);
  }
}

class UnauthorizedError extends ClientError {
  constructor() {
    super("Unauthorized", 403);
  }
}

class NotFoundError extends ClientError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

module.exports = {
  heimdall,
  checkParameters,
  ClientError,
  MissingParameterError,
  UnauthorizedError,
  NotFoundError,
  ServerError
};
