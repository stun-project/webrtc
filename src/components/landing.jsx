import './landing.css';
import {useState} from 'react';
import {socket} from "../socket";


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

  async function joinRoom(){
    let roomExists = await scoutRoom(makeRoomId) 
    if(!roomExists){
      props.history.push("/rooms/" + joinRoomId);
    }
    else{
      setJoinRoomId("No such room exists")
    }
  }
  
  async function makeRoom(){
    let roomExists = await scoutRoom(makeRoomId) 
    if(!roomExists){
      socket.emit("createRoom", makeRoomId)
      props.history.push("/rooms/" + makeRoomId);
    }
    else{
      setMakeRoomId("Room already exists with that name")
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