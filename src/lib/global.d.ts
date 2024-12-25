interface WebKitMessageHandler {
    postMessage: (message: any) => void;
  }
  
  interface WebKitMessageHandlers {
    profile: WebKitMessageHandler;
  }
  
  interface WebKit {
    messageHandlers: WebKitMessageHandlers;
  }
  
  interface Window {
    webkit?: WebKit;
  }