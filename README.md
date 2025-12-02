# Micro API

WebSocket proxy server for microcontroller projects. Routes messages between microcontrollers and frontends using stream-based channels.

## Installation

```bash
npm install
```

## Usage

```bash
npm start
# or for development with auto-reload
npm run dev
```

Server runs on `http://localhost:8080`

## Stream Pattern

Clients (microcontrollers or frontends) connect and join a named stream. Messages sent to a stream are broadcast to all other clients in that stream.

### Connecting

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  // Join a stream
  ws.send(JSON.stringify({
    type: 'join',
    stream: 'color-value'  // or any stream name
  }));
};
```

### Sending Data

```javascript
ws.send(JSON.stringify({
  type: 'data',
  value: 128,
  color: 'red'
  // any data you want
}));
```

### Receiving Data

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Received:', msg);
};
```

## Project Handlers

Custom logic can be added for specific streams. Edit the `projectHandlers` object in `server.js`:

```javascript
const projectHandlers = {
  'color-value': (msg, ws, streams) => {
    console.log('Color-value handler:', msg);
    broadcast(streams, ws.currentStream, msg, ws);
  }
  // Add more handlers as needed
};
```

If no handler exists for a stream, messages are simply broadcast (passthrough mode).

## API Endpoints

- `GET /` - Server info and active streams
- `GET /health` - Health check

## Example Arduino Code

```cpp
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

void setup() {
  webSocket.begin("192.168.1.100", 8080, "/");

  webSocket.onEvent([](WStype_t type, uint8_t * payload, size_t length) {
    if (type == WStype_CONNECTED) {
      // Join stream
      webSocket.sendTXT("{\"type\":\"join\",\"stream\":\"color-value\"}");
    }
  });
}

void loop() {
  webSocket.loop();

  // Send data
  String data = "{\"type\":\"data\",\"value\":" + String(analogRead(A0)) + "}";
  webSocket.sendTXT(data);
  delay(1000);
}
```
