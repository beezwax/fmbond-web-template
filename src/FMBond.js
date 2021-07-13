/* --------------------------- Instance Methods (Public) ------------------------------------ */

function FMBond(options = {}) {
  /* Special handling for calls from FileMaker */
  const argArray = Array.from(arguments);
  if (typeof argArray[0] === "string" && argArray[0].length) {
    return FMBond._handleJSCallFromFM(argArray[0], argArray.slice(1));
  } else if (argArray.length === 2) {
    return FMBond._handleCallbackFromFM(argArray[1]);
  }
  /* Handling for missed 'new' keyword */
  if (!(this instanceof FMBond)) {
    return new FMBond(options);
  }
  if (typeof options !== "object") {
    throw FMBond.ERROR("-1", "The options argument must be of type object");
  }
  this.options = { ...FMBond._defaultOptions, ...options };
  FMBond._webViewerName = options.webViewerName || FMBond._webViewerName;
  FMBond.getWebViewerName = function () {
    return FMBond._webViewerName;
  };
  return this;
}

FMBond.prototype.setOptions = function (options = {}) {
  if (options.webViewerName) {
    FMBond._webViewerName = options.webViewerName;
  }
  return new FMBond({ ...this.options, ...options });
};

FMBond.prototype.webViewerName = function (webViewerName) {
  return this.setOptions({ webViewerName });
};

FMBond.prototype.server = function (server = false) {
  return this.setOptions({ server });
};

FMBond.prototype.waitForCompletion = function (waitForCompletion = false) {
  return this.setOptions({ waitForCompletion });
};

FMBond.prototype.localFallback = function (localFallback = false) {
  return this.setOptions({ localFallback });
};

FMBond.prototype.timeout = function (timeoutInMilliseconds = null) {
  return this.setOptions({ timeout: timeoutInMilliseconds });
};

FMBond.prototype.callType = function (callType = FMBond.DEFAULT) {
  return this.setOptions({ callType });
};

FMBond.prototype.relayScript = function (relayScriptName) {
  return this.setOptions({ relayScript: relayScriptName });
};

FMBond.prototype.performScript = function (
  scriptName,
  scriptParameters = "",
  overrideOptions = {}
) {
  /* If overrideOptions is not an object, treat it as the callType */
  const newOptions =
    typeof overrideOptions === "object"
      ? overrideOptions
      : { callType: overrideOptions };

  const webViewerName =
    newOptions.webViewerName ||
    this.options.webViewerName ||
    FMBond._webViewerName;
  const webViewerObject = {
    webViewerName,
  };

  const callbackUUID = FMBond._uuid();
  const options = { ...this.options, ...newOptions, ...webViewerObject };
  const filemakerParameters = {
    callbackUUID,
    options,
    script: {
      name: scriptName,
      parameters: scriptParameters,
    },
  };

  /* Create a new deferred Promise */
  const deferred = new FMBond.DEFERRED();
  FMBond._resultMap.set(callbackUUID, deferred);

  if (typeof FileMaker !== "undefined") {
    FMBond._performScriptHandler(filemakerParameters);
  } else {
    const objectTimeout = 100;
    const startTime = new Date().getTime();
    const interval = setInterval(function () {
      if (typeof FileMaker !== "undefined") {
        clearInterval(interval);
        FMBond._performScriptHandler(filemakerParameters);
      } else if (new Date().getTime() - objectTimeout > startTime) {
        clearInterval(interval);
        FMBond._handleRejection(
          callbackUUID,
          FMBond.ERROR("-9", "FileMaker object not found")
        );
      }
    }, 1);
  }
  /* Return the Promise */
  return deferred.promise;
};

/* --------------------------- Class Methods (Public) ------------------------------------ */

FMBond.setOptions = function (options) {
  return this._baseInstance.setOptions(options);
};
FMBond.webViewerName = function (webViewerName) {
  return this.setOptions({ webViewerName });
};
FMBond.server = function (server) {
  return this.setOptions({ server });
};
FMBond.waitForCompletion = function (waitForCompletion) {
  return this.setOptions({ waitForCompletion });
};
FMBond.localFallback = function (localFallback) {
  return this.setOptions({ localFallback });
};
FMBond.timeout = function (timeoutInMilliseconds) {
  return this.setOptions({ timeout: timeoutInMilliseconds });
};
FMBond.callType = function (callType) {
  return this.setOptions({ callType });
};
FMBond.relayScript = function (relayScriptName) {
  return this.setOptions({ relayScript: relayScriptName });
};

FMBond.performScript = function (
  scriptName,
  scriptParameters,
  overrideOptions = {}
) {
  return FMBond._baseInstance.performScript(
    scriptName,
    scriptParameters,
    overrideOptions
  );
};

FMBond.RegisterScript = function (pluginOptions) {
  const { exec, scriptName, throwIf } = pluginOptions;
  if (typeof pluginOptions !== "object" || !exec || !scriptName) {
    throw FMBond.ERROR(
      "-2",
      "Invalid plugin parameters: [ exec, scriptName ] are required properties. Provided: " +
        exec +
        " " +
        scriptName
    );
  }
  if (this[exec] || this.prototype[exec]) {
    throw FMBond.ERROR(
      "-3",
      "Unable to register " + exec + ". Please try a different name."
    );
  }

  const resultHandler = throwIf
    ? (result) => {
        if (throwIf(result)) {
          throw result;
        }
        return result;
      }
    : (result) => result;

  this[exec] = function (scriptParameters, options = {}) {
    return this._baseInstance
      .performScript(scriptName, scriptParameters, options)
      .then(resultHandler);
  };

  this.prototype[exec] = function (scriptParameters, options = {}) {
    return this.performScript(scriptName, scriptParameters, options).then(
      resultHandler
    );
  };

  return this;
};

/* Set the web viewer name from FileMaker */
FMBond.setWebViewerNameFromFm = function () {
  if (FMBond.getWebViewerName()) {
    return Promise.resolve();
  }
  const params = {
    type: "WEB_VIEWER_NAME",
  };
  return FMBond.performScript(
    FMBond._defaultOptions.relayScript,
    JSON.stringify(params)
  );
};

/* --------------------------- Class Properties / Methods (Public/Private) ------------------------------------ */

/*
 * The web viewer name is stored at the class-level.
 */
FMBond._webViewerName = "";

/*
 * The result map is populated with a uuid:scriptResult key-value pair.
 * We use this to handle the result returned by a FileMaker call.
 */
FMBond._resultMap = new Map();

/*
 * Contains the default options used by every call. Overrides temporarily change these
 * until .performScript() is called.
 */
FMBond._defaultOptions = {
  /* PSoS on server */
  server: false,

  /* FileMaker option to Wait for PSoS script to complete. */

  waitForCompletion: true,
  /* If PSoS fails, perform locally instead */

  localFallback: false,

  /* null|number in milliseconds to wait before rejecting. */
  timeout: null,

  /*
    ~~~ The FileMaker 'call type'

    0 | '0' | 'continue'  | FMBond.CONTINUE
    After a currently running FileMaker script has completed, queued FileMaker scripts are run in order.
    If FileMaker script execution is canceled, the queue is cleared.
    This is the behavior if option is not specified.
    This is also the default behavior for FileMaker.PerformScript() starting in version 19.1.2.

    1 | '1' | 'halt'      | FMBond.HALT
    Execution of a currently running FileMaker script is halted, and all other pending scripts (queued or in the call stack) are canceled.
    Then script is run.

    2 | '2' | 'exit'      | FMBond.EXIT
    A currently paused FileMaker script is exited.
    If the currentFileMaker script was called by another FileMaker script, control returns to the calling FileMaker script until no more scripts remain in the call stack.
    Then script is run.

    3 | '3' | 'resume'    | FMBond.RESUME
    A paused FileMaker script is resumed. After the resumed script is completed, script is run.

    4 | '4' | 'pause'     | FMBond.PAUSE
    A paused FileMaker script remains paused. If the paused script is resumed and completed, then script is run.

    5 | '5' | 'Interrupt' | FMBond.INTERRUPT
    A currently running FileMaker script is interrupted and script is run.
    When script is completed, the interrupted script resumes with the next script step.
    A paused script remains paused while script is run.
    This is the original behavior of FileMaker.PerformScript() in version 19.0.0.
  */
  callType: 0,

  /* The default name of the FileMaker script that acts as a 'relay' between Javascript and your FileMaker scripts */
  relayScript: "FMBondRelay",
};

/*
 * FMBond uses this base instance for methods called directly on the Class itself
 */
FMBond._baseInstance = new FMBond();

/*  Call Type - Constants & Internal Map */
FMBond.CONTINUE = "0";
FMBond.HALT = "1";
FMBond.EXIT = "2";
FMBond.RESUME = "3";
FMBond.PAUSE = "4";
FMBond.INTERRUPT = "5";
FMBond.DEFAULT = FMBond.CONTINUE;

FMBond._callTypeMap = new Map();

FMBond._callTypeMap
  .set(null, FMBond.CONTINUE)
  .set("null", FMBond.CONTINUE)
  .set(undefined, FMBond.CONTINUE)
  .set("undefined", FMBond.CONTINUE)
  .set(0, FMBond.CONTINUE)
  .set("0", FMBond.CONTINUE)
  .set("continue", FMBond.CONTINUE);

FMBond._callTypeMap
  .set(1, FMBond.HALT)
  .set("1", FMBond.HALT)
  .set("halt", FMBond.HALT);

FMBond._callTypeMap
  .set(2, FMBond.EXIT)
  .set("2", FMBond.EXIT)
  .set("exit", FMBond.EXIT);

FMBond._callTypeMap
  .set(3, FMBond.RESUME)
  .set("3", FMBond.RESUME)
  .set("resume", FMBond.RESUME);

FMBond._callTypeMap
  .set(4, FMBond.PAUSE)
  .set("4", FMBond.PAUSE)
  .set("pause", FMBond.PAUSE);

FMBond._callTypeMap
  .set(5, FMBond.INTERRUPT)
  .set("5", FMBond.INTERRUPT)
  .set("interrupt", FMBond.INTERRUPT);

FMBond._uuid = (function () {
  const symbolArray = "0123456789abcdefghijklmnopqrstuvwxyz"
    .split("")
    .sort(() => 0.5 - Math.random());
  return function () {
    let id = "";
    for (let i = 0; i < 32; i++) {
      id += symbolArray[Math.floor(Math.random() * symbolArray.length)];
    }
    return (
      id.substr(0, 8) +
      "-" +
      id.substr(8, 4) +
      "-" +
      id.substr(12, 4) +
      "-" +
      id.substr(16, 4) +
      "-" +
      id.substr(20, 12)
    );
  };
})();

FMBond._performScriptHandler = function (filemakerParameters) {
  const { callbackUUID, options } = filemakerParameters;
  const { timeout, callType, relayScript } = options;

  /*
   * relayScript must be a valid string.
   */
  if (!relayScript) {
    return FMBond._handleRejection(
      callbackUUID,
      FMBond.ERROR("-4", relayScript + " is not a valid relay script name.")
    );
  }

  /*
   * Compare the user-provided callType to our internal callTypeMap - if it's invalid, we reject.
   */
  const callTypeCheck = String(callType).toLowerCase();
  if (!FMBond._callTypeMap.has(callTypeCheck)) {
    return FMBond._handleRejection(
      callbackUUID,
      FMBond.ERROR("-5", callType + " is not a valid call type.")
    );
  }

  /* Attempt to perform our wrapper script */
  try {
    /* As of FileMaker 19.1.2, we can use PerformScriptWithOption */
    if (typeof FileMaker.PerformScriptWithOption !== "undefined") {
      FileMaker.PerformScriptWithOption(
        relayScript,
        JSON.stringify(filemakerParameters),
        FMBond._callTypeMap.get(callTypeCheck)
      );
    } else {
      FileMaker.PerformScript(relayScript, JSON.stringify(filemakerParameters));
    }
  } catch (e) {
    return FMBond._handleRejection(callbackUUID, FMBond.ERROR("-6", e.message));
  }

  /* Throw timeout error when timeout is reached */
  if (timeout) {
    const timeoutFunc = setTimeout(function () {
      clearTimeout(timeoutFunc);
      if (FMBond._resultMap.has(callbackUUID)) {
        FMBond._handleRejection(
          callbackUUID,
          FMBond.ERROR(
            "-7",
            "Failed to resolve promise within " + timeout + "ms."
          )
        );
      }
    }, timeout);
  }
};

FMBond._handleCallbackFromFM = function (callbackString) {
  const callbackObject = JSON.parse(callbackString);
  const { response, messages } = callbackObject;
  const { callbackUUID, scriptResult, webViewerName } = response;
  const { code, message } = messages[0];

  if (FMBond._resultMap.has(callbackUUID)) {
    /* Update the webViewerName */
    FMBond._webViewerName = webViewerName;

    /* Reject if some sort of Exceptional Error occurred in FileMaker */
    if (code !== "0") {
      return this._handleRejection(
        callbackUUID,
        FMBond.ERROR(code, message).setResponse(response)
      );
    }

    /*
     * Parse out the response:
     *   • JSON Objects turn into Javascript Objects.
     *   • Numbers or numeric strings into numbers.
     *   • Alphanumeric Strings are left as strings.
     */
    let parsedScriptResult = scriptResult;
    try {
      parsedScriptResult = JSON.parse(scriptResult);
    } catch (e) {}
    FMBond._handleResolution(callbackUUID, parsedScriptResult);
  } else {
    throw FMBond.ERROR(
      "-8",
      "This FMBond library was unable to handle a callback from a FileMaker script."
    );
  }
};

FMBond._handleResolution = function (callbackUUID, scriptResult) {
  if (FMBond._resultMap.has(callbackUUID)) {
    const { resolve } = FMBond._resultMap.get(callbackUUID);
    resolve(scriptResult);
    FMBond._handleCleanup(callbackUUID);
  }
};

FMBond._handleRejection = function (callbackUUID, errorResult) {
  if (FMBond._resultMap.has(callbackUUID)) {
    const { reject } = FMBond._resultMap.get(callbackUUID);
    reject(errorResult);
    FMBond._handleCleanup(callbackUUID);
  }
};

FMBond._handleCleanup = function (callbackUUID) {
  if (FMBond._resultMap.has(callbackUUID)) {
    FMBond._resultMap.delete(callbackUUID);
  }
};

/* Handles calls directly from FileMaker to the web viewer using the 'Perform JavaScript in Web Viewer' script step */
FMBond._handleJSCallFromFM = function (functionName, functionArgArray = []) {
  const result = new FMBond.ERROR();
  let thisFunction = null;
  try {
    if (functionName.indexOf("{") !== -1 || functionName.indexOf("=>") !== -1) {
      thisFunction = new Function("return " + functionName)();
    } else {
      thisFunction = eval(functionName);
    }
  } catch (e) {}
  if (typeof thisFunction !== "function") {
    result.messages[0].code = "5";
    result.messages[0].message =
      "The function '" +
      functionName +
      "' is missing from the global scope." +
      " The Perform Javascript in Web Viewer script step must have " +
      "the first parameter as the name of the function you wish to call.";
  } else {
    const formattedArgArray = functionArgArray.map((arg) => {
      let newArg = arg;
      try {
        if (newArg[0] === "ƒ") {
          newArg = new Function("return " + newArg.slice(1))();
        } else {
          newArg = JSON.parse(arg);
        }
      } catch (e) {}
      return newArg;
    });
    try {
      result.response.result = thisFunction(...formattedArgArray);
    } catch (e) {
      result.messages[0].code = "5";
      result.messages[0].message = `An unhandled exception occurred in the provided JavaScript function:\n${e.toString()}`;
    }
  }
  const params = {
    type: "FM_JS",
    result,
  };
  FileMaker.PerformScriptWithOption(
    FMBond._defaultOptions.relayScript,
    JSON.stringify(params),
    FMBond.INTERRUPT
  );
};

/*
 * Error Handling
 */
FMBond.ERROR = function (code = "0", message = "OK") {
  if (!(this instanceof FMBond.ERROR)) {
    return new FMBond.ERROR(code, message);
  }
  this.response = {};
  this.messages = [];
  this.addMessage(code, message);
  return this;
};

FMBond.ERROR.prototype.addMessage = function (code, message) {
  this.messages.push({
    code: String(code),
    message,
  });
  return this;
};

FMBond.ERROR.prototype.setResponse = function (response = {}) {
  this.response = response;
  return this;
};

FMBond.ERROR.prototype.toString = function () {
  return JSON.stringify(this);
};

/*
 * Deffered Promise Handling
 */

FMBond.DEFERRED = function () {
  this.promise = new Promise(
    function (resolve, reject) {
      this.reject = reject;
      this.resolve = resolve;
    }.bind(this)
  );
};

export default FMBond;
