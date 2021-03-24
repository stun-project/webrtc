import "./partner.css";
import { useEffect, useRef } from "react";

function Partner(props) {
  const partnerVideo = useRef();

  useEffect(() => {
    partnerVideo.current.srcObject = props.peerConnection;
  }, [props.peerConnection]);

  return (
    <div style={props.styling.divStyle}>
      <video
        autoPlay={true}
        ref={partnerVideo}
        style={props.styling.videoStyle}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default Partner;
