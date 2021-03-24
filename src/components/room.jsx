import "./room.css";
import { useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import Partner from "./partner";

function Room(props) {
  let id = "";
  const [peerConnections, setPeerConnections] = useState({});
  const [peerVideos, setPeerVideos] = useState([]); //for rendering purposes
  const videoRef = useRef();
  const peerVideoRef = useRef();
  const videoStream = useRef();
  const styling = {
    videoStyle: {
      width: 1280,
      margin: 10,
    },
    divStyle: {
      "min-width": 350,
      display: "inline",
    },
  };

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    await initializeVideo();
    initializeSocket();
  };

  const initializeSocket = () => {
    const roomId = window.location.href.toString().split("/")[
      window.location.href.toString().split("/").length - 1
    ];
    socket.emit("my_name_is");
    socket.emit("joinRoom", roomId);
    socket.on("you", (myId) => {
      id = myId;
    });
    socket.on("joinedRoom", (peersConnected) => {
      if (peersConnected !== undefined && peersConnected !== null) {
        peersConnected.forEach((peerId) => {
          makeCall(peerId);
        });
      }
    });
    socket.on("offer", async (message) => {
      await receiveCall(message);
    });

    socket.on("candidate", async (message) => {
      if (message.candidate) {
        try {
          await peerConnections[message.senderId].addIceCandidate(
            message.candidate
          );
        } catch (e) {
          console.error("Error adding received ice candidate", e);
        }
      }
    });

    socket.on("answer", async (message) => {
      if (message.answer) {
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConnections[message.senderId].setRemoteDescription(
          remoteDesc
        );
      }
    });

    socket.on("thisPeerLeft", (peerId) => {
      console.log(`Peer: ${peerId} is leaving, removing...`);
      const peerConnection = peerConnections[peerId];

      const tempPeerConections = peerConnections;
      delete tempPeerConections[peerId];
      setPeerConnections(tempPeerConections);
      console.log(
        `Peer: ${peerId} Is removed from PeerconnectionsObject ${peerConnections}`
      );

      //   setPeerConnectionArr((peerConnectionArr) =>
      //   [...peerConnectionArr].filter(
      //     (pc) => pc == peerConnection
      //   )
      // );

      setPeerVideos((peerVideos) =>
        peerVideos.filter((pv) => pv.id !== peerId)
      );
    });

    // socket.on('thisPeerLeft', ()=>{
    //     window.location.reload()
    // })
  };

  const initializeVideo = async () => {
    const constraints = {
      video: {
        width: 1280,
        height: 720,
      },
      audio: true,
    };

    await navigator.mediaDevices
      .getDisplayMedia(constraints)
      .then((stream) => {
        videoStream.current = stream;
        let video = videoRef.current;
        video.srcObject = stream;
      })
      .then()
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });
  };

  const renderUserVideo = () => {
    if (peerVideos.length > 3) {
      styling.videoStyle = {
        width: 1280 / 3,
        margin: 10,
      };
    } else if (peerVideos.length >= 1) {
      styling.videoStyle = {
        width: 1280 / 2,
        margin: 10,
      };
    }

    return (
      <div style={styling.divStyle}>
        <video autoPlay={true} ref={videoRef} muted style={styling.videoStyle}>
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  const renderPartnerVideo = () => {
    let peerSet = [];
    let lastid = "";

    peerVideos.forEach((peer) => {
      if (peer.id !== lastid) {
        peerSet.push(peer);
      }
      lastid = peer.id;
    });

    if (peerSet.length > 3) {
      styling.videoStyle = {
        width: 1280 / 3,
        margin: 10,
      };
    } else if (peerSet.length >= 1) {
      styling.videoStyle = {
        width: 1280 / 2,
        margin: 10,
      };
    }

    console.log(peerVideos);
    console.log(peerSet);

    let peers = peerSet.map((peerConnection, index) => {
      return (
        <Partner
          key={index}
          peerConnection={peerConnection.stream}
          styling={styling}
        ></Partner>
      );
    });

    return peers;
  };

  const makeCall = async (peerId) => {
    const peerConnection = initializePeerConnection(peerId);
    const tempPeerConections = peerConnections;
    tempPeerConections[peerId] = peerConnection;
    setPeerConnections(tempPeerConections);

    videoStream.current.getTracks().forEach((track) => {
      peerConnections[peerId].addTrack(track, videoStream.current);
    });

    peerConnection.onnegotiationneeded = async () => {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit("offer", { id: peerId, senderId: id, offer: offer });
      console.log("I renegotiated");
    };
  };

  const initializePeerConnection = (peerId) => {
    const configuration = {
      iceServers: [
        { url: "stun:sandring.no:3478" },
        {
          url: "turn:sandring.no:3478",
          credential: "12345",
          username: "test",
        },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onconnectionstatechange = function (event) {
      switch (peerConnection.connectionState) {
        case "connected":
          console.log("Connected");
          // The connection has become fully connected
          break;
        case "disconnected":
          console.log("Disconnection");
          break;
        case "failed":
          console.log("Connection failed");
          // One or more transports has terminated unexpectedly or in an error
          break;
        case "closed":
          console.log("Connection closed");
          // The connection has been closed
          break;
        default:
          break;
      }
    };

    peerConnection.addEventListener("track", (event) => {
      console.log(peerId);

      setPeerVideos((peerVideos) => [
        ...peerVideos,
        { id: peerId, stream: event.streams[0] },
      ]);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", {
          id: peerId,
          senderId: id,
          candidate: event.candidate,
        });
      }
    };

    return peerConnection;
  };

  const receiveCall = async (message) => {
    const peerConnection = initializePeerConnection(message.senderId);
    const tempPeerConections = peerConnections;
    tempPeerConections[message.senderId] = peerConnection;
    console.log("recieved a call from: ", peerConnection);

    setPeerConnections(tempPeerConections);

    if (message.offer) {
      peerConnections[message.senderId].setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );

      videoStream.current.getTracks().forEach((track) => {
        peerConnections[message.senderId].addTrack(track, videoStream.current);
      });
      const answer = await peerConnections[message.senderId].createAnswer();
      await peerConnections[message.senderId].setLocalDescription(answer);

      socket.emit("answer", {
        senderId: id,
        id: message.senderId,
        answer: answer,
      });
    }
  };

  return (
    <div className="videoRoom">
      {renderUserVideo()}
      {renderPartnerVideo()}
    </div>
  );
}

export default Room;
