import './App.css';
import Header from './components/header'
import Landing from './components/landing'
import Room from './components/room'
import { Route, BrowserRouter as Router } from "react-router-dom";


function App() {
  return (
    <Router>
      <div className="App">
        <Header/>
        <Route exact path="/" component={Landing}/>
        <Route exact path="/rooms" component={Landing}/>
        <Route exact path="/rooms/:id"  component={Room}/>
      </div>
    </Router>
  );
}

export default App;
