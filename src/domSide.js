"use strict";
{
  // Update the DOM_COMPONENT_ID to be unique to your plugin.
  // It must match the value set in instance.js as well.

  //<-- DOM_COMPONENT_ID -->

  // This class handles messages from the runtime, which may be in a Web Worker.
  const HANDLER_CLASS = class extends self.DOMHandler {
    constructor(iRuntime) {
      super(iRuntime, DOM_COMPONENT_ID);
    }
  };

  self.RuntimeInterface.AddDOMHandlerClass(HANDLER_CLASS);
}
