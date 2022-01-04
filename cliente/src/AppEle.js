import React, { useState, useEffect } from 'react';
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

export default function AppEle() {

    const [currentUsers, setCurrentUsers] = useState([])
    const [logs, setLogs] = useState([])
    const [username, setUsername] = useState(null)
    const [text, setText] = useState([])



 useEffect(()=>{
   client.onopen = () => {
     console.log('WebSocket Client Connected');
   };

   client.onmessage = (message) => {
     const dataFromServer = JSON.parse(message.data);
     if (dataFromServer.type === "userevent") {
         setCurrentUsers(Object.values(dataFromServer.data.users))
     } else if (dataFromServer.type === "contentchange") {
       setText(dataFromServer.data.editorContent)  
     }
     setLogs(dataFromServer.data.logs);
   }
 },[])
 
 function changeUserCampo(e){
    setUsername(e.target.value)
 }

 
  const logInUser = () => {
    
    if (username.trim()) {
      const data = {
        username
      };
      client.send(JSON.stringify({
        ...data,
        type: "userevent"
      }));
    }
  }

  /* When content changes, we send the
current content of the editor to the server. */
 const onEditorStateChange = (text) => {
   client.send(JSON.stringify({
     type: "contentchange",
     username: username,
     content: text
   }));
 };



  const showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">Bienvenido</p>
          </div>
          <input name="username" onChange={changeUserCampo} className="form-control" value={username}/>
          <button type="button" className="btn btn-primary account__btn">Unirse</button>
        </div>
      </div>
    </div>
  )

  const showEditorSection = () => (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          {currentUsers.map(user => (
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
              text: text ? contentDefaultMessage : ""
            }
          }}
          className="body-editor"
          text={text}
          onChange={onEditorStateChange}
        />
      </div>
      <div className="history-holder">
        <ul>
          {logs.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
        </ul>
      </div>
    </div>
  )

    return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Editor de texto en tiempo real</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {username ? showEditorSection() : showLoginSection()}
        </div>
      </React.Fragment>
    )
}
