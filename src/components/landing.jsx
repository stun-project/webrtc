import './landing.css';
import {useState} from 'react';
import { io } from "socket.io-client";
const socket = io("localhost:8000/");


function Landing(props) {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [makeRoomId, setMakeRoomId] = useState("");
  

  const handleChangeJoin = (evt) => {
    setJoinRoomId(evt.target.value);
  }
  
  const handleChangeMake = (evt) => {
    setMakeRoomId(evt.target.value);
  }

  async function scoutRoom(roomId){
    let res =  await new Promise(resolve => {
      socket.emit('scout', roomId, (answer) => {
        resolve(answer);
      });
    });   
    return res;
  }

  function joinRoom(){
    if(scoutRoom(joinRoomId)){
      props.history.push("/rooms/" + joinRoomId);
    }
  }
  
  async function makeRoom(){
    if(!(await scoutRoom(makeRoomId))){
      props.history.push("/rooms/" + makeRoomId);
    }
  }

  return (
    <div className="landing">
        <p>Here you can chat with strangers or friends!</p>
        <h2>Enter your display name to get started</h2>
        <div>
          <input type="text" value={joinRoomId} onChange = {(evt) => handleChangeJoin(evt)} ></input>
          <button onClick={joinRoom}>JOIN ROOM</button>
        </div>
        <div>
          <input type="text" value={makeRoomId} onChange = {(evt) => handleChangeMake(evt)} ></input>
          <button onClick={makeRoom}>CREATE ROOM</button>
        </div>
      </div>
  );
}

export default Landing;