import { io } from "socket.io-client";
//export const socket = io("localhost:8000");

export const socket = io(`${process.env.REACT_APP_SIGNAL_SERVER_URL}/`, {
  path: `${process.env.REACT_APP_SIGNAL_SERVER_PATH}`,
});

socket.on("disconnect", function () {
  socket.open();
});
