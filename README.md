# Webrtc - videochatroom

This is a video-chat application made with react, using the webrtc API and a signal server found here (https://github.com/stun-project/signal_server). It allows several peers to connect at once.

## Implemented functionality
- Group videochat
- Pong... maybe

## Future work
- Textchatting in room
- Share screen
- Authentication
- Room overview
- Share-button
- Write tests

## Dependencies
- Browser webrtc API
- Socket.io library  
&nbsp;&nbsp;&nbsp; It is used to enable full duplex communucation between the client and the signal-server

## Setup
Setup instructions assume that you have cloned both the signal server and this repository, and that you have npm installed. 

### Local dev setup
Starting up the signal server
```bash
cd signal_server
npm install
node signal.js
```
Starting the react app
```bash
cd webrtc
npm install
npm start
```

### Docker compose setup
Docker and Docker-compose are required for this setup.  
Build the frontend image:
```bash
cd webrtc
docker build -t Sigmundgranaas/webrtc .
```
Build the signal server image:  
```bash
cd signal_server
docker build -t Sigmundgranaas/signal_server .
```
Finally start the containers:  
```bash
cd webrtc
docker-compose up
```
