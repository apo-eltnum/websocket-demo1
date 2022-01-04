import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from 'react-identicons';
import {
  Navbar,
  NavbarBrand,
  UncontrolledTooltip
} from 'reactstrap';
import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import './App.css';

const client = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Start writing your document here";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUsers: [],
      logs: [],
      username: null,
      text: ''
    };
  }

  logInUser = () => {
    const username = this.username.value;
    if (username.trim()) {
      const data = {
        username
      };
      this.setState({
        ...data
      }, () => {
        client.send(JSON.stringify({
          ...data,
          type: "userevent"
        }));
      });
    }
  }

  /* When content changes, we send the
current content of the editor to the server. */
 onEditorStateChange = (text) => {
   client.send(JSON.stringify({
     type: "contentchange",
     username: this.state.username,
     content: text
   }));
 };

 componentWillMount() {
   client.onopen = () => {
     console.log('WebSocket Client Connected');
   };
   client.onmessage = (message) => {
     const dataFromServer = JSON.parse(message.data);
     const stateToChange = {};
     if (dataFromServer.type === "userevent") {
       stateToChange.currentUsers = Object.values(dataFromServer.data.users);
     } else if (dataFromServer.type === "contentchange") {
       stateToChange.text = dataFromServer.data.editorContent || contentDefaultMessage;
     }
     stateToChange.logs = dataFromServer.data.logs;
     this.setState({
       ...stateToChange
     });
   };
 }

  showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">Bienvenido</p>
          </div>
          <input name="username" ref={(input) => { this.username = input; }} className="form-control" />
          <button type="button" onClick={() => this.logInUser()} className="btn btn-primary account__btn">Unirse</button>
        </div>
      </div>
    </div>
  )

  showEditorSection = () => (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          {this.state.currentUsers.map(user => (
            <React.Fragment>
              <span id={user.username} className="userInfo" key={user.username}>
                <Identicon className="account__avatar" style={{ backgroundColor: user.randomcolor }} size={40} string={user.username} />
              </span>
              <UncontrolledTooltip placement="top" target={user.username}>
                {user.username}
              </UncontrolledTooltip>
            </React.Fragment>
          ))}
        </div>
        <Editor
          options={{
            placeholder: {
              text: this.state.text ? contentDefaultMessage : ""
            }
          }}
          className="body-editor"
          text={this.state.text}
          onChange={this.onEditorStateChange}
        />
      </div>
      <div className="history-holder">
        <ul>
          {this.state.logs.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
        </ul>
      </div>
    </div>
  )

  render() {
    const {
      username
    } = this.state;
    return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Editor de texto en tiempo real</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {username ? this.showEditorSection() : this.showLoginSection()}
        </div>
      </React.Fragment>
    );
  }
}

export default App;
