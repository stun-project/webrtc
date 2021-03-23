import { io } from "socket.io-client";
export const socket = io("localhost:8000");

// export const socket = io("https://sandring.no/", {
//   path: "/api/socket.io/",
// });

socket.on("disconnect", function () {
  socket.open();
});
