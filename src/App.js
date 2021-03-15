import './App.css';
import Header from './components/header'
import Landing from './components/landing'
import {useState} from 'react';
import P2p from './components/p2p'

function App() {
  const [connecting, setConnecting] = useState(false);
  const [name, setName] = useState("");


  const connect = (name) => {
    setConnecting(true);
    setName(name);
  };


  return (
    <div className="App">
      <Header/>
      {connecting ?<P2p name={name}/>:<Landing connect={connect}/>}
    </div>
  );
}

export default App;
