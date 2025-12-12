# Development Log

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



