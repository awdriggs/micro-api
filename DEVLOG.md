# Development Log
## d05072026
exploring mqtt as a replacement for websockets on the pico w — main driver is power consumption. websockets require a persistent connection so the pico can't sleep between sends. mqtt allows wake, publish, disconnect, sleep.

leaning toward adafruit io as the broker to start. built for maker/iot projects, free tier, no infra to manage. topic format is `<username>/feeds/<feed-name>`. rate limit is 30 data points/minute.

planned architecture:
- pico publishes to adafruit io via mqtt
- node server subscribes to adafruit io, saves to mongodb, broadcasts over websocket to browser clients
- frontend gets live data directly from adafruit io (mqtt.js over websocket)
- frontend gets historical data from our own `GET /api/readings/shades-of-blue` endpoint

adafruit io can serve historical data via their rest api (up to 30 days), but keeping mongodb as the source of truth so we own the data indefinitely. decision on whether to rely on adafruit io for storage or keep mongodb is still open.

not implementing yet — still deciding on final approach.

## d05062026
- added `GET /api/readings/:dbName` route to retrieve sensor data from mongodb
  - `?limit=n` returns the newest n records (default 50)
  - `?before=` and `?after=` accept ISO timestamps for range queries
  - checks that the db exists, returns 404 if not
  - queries `sensor_data` collection directly (no mongoose model) so it works across any project db
- added `cors` middleware to allow browser `fetch` calls — currently open (`*`)
  - TODO: lock down to specific origin once frontend url is known: `app.use(cors({ origin: 'https://yoursite.com' }))`

## d12182025
lots of changes.
- add mongoose to connect to mongodb atlas
- created a model for shades of blue readings
- created a custom handler to save readings to the database when you get them
- tested locally, works.
- refactored code with claude to be more abstracted.
- added mongoose connection stream to dokku site.


## d12042025
testing the server with the pico w

websocat sockets code sending pico temperature data 
`{"type":"join","stream":"pico-temp"}`


websocat testing eight px code 
`{"type":"join","stream":"eight-px"}`


## d12022025
setup webserver with node, express, and websockets module.

testing locally using `websocat` tool. 
- start tool - `websocat ws://localhost:3000`, or whatever socket server

Sample Tests:
- connect - `{"type":"join","stream":"color-value"}`
- send - `{"type":"data","color":"red","value":128}`

Created a simple frontend example to interact with the server when it was locally hosted for testing. Need to updated with hosted server name later. 

Pushed to awdokku.site, testing and working

Noticed that websocat wasn't losing connection quickly, so implemented a simple heartbeat pattern with claude.



