import { io } from "socket.io-client";
export const socket = io.connect("localhost:8000/");
socket.on("disconnect",function(){
    socket.open();
});