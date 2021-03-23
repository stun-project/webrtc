# Webrtc - videochatroom

This is a video-chat application made with react, using the webrtc API and a signal server found here (https://github.com/stun-project/signal_server). It allows several peers to connect at once.

## Implemented functionality
- videochat
- pong... maybe

## Future work
- textchatting in romm
- share screen
- authentication
- room overview
- share-button
- write tests

## Dependencies
- browser webrtc API
- socket.io library
- It is used to enable full duplex communucation between the client and the signal-server

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
