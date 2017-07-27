import * as React from 'react';
import { Toolbar, Actionbar, Button, ButtonGroup, Window, Content, PaneGroup, Pane } from "react-photonkit";
import { Api } from '../api/Api';
import { Server as SCServer, ServerEvent as SCServerEvent } from '../api/Server';

interface State {
  events: SCServerEvent[],
  listener: (SCServerEvent) => void
}

export default class Console extends React.Component<any, State> {
  private listener;

  constructor() {
    super();
    this.state = {
      events: Api.getServer().getEvents(),
      listener: ((e) => {
        this.setState((prev, props) => { prev.events.push(e); return prev; });
        console.log(this.state.events);
      }).bind(this)
    };
  }

  componentDidMount() {
    console.log("MOUNTED");
    //setTimeout(() => Api.getServer().registerListener(this.state.listener),1000);
  }

  componentWillUnmount() {
    console.log("UNMOUNTED");
    //Api.getServer().deregisterListener(this.state.listener);
  }

  clearLog() {
    this.setState({ events: [] });
  }

  startServer() {
    Api.getServer().start();
  }

  stopServer() {
    Api.getServer().stop();
  }

  render() {
    let consoleStyle = {
      backgroundColor: "black",
      color: "#EEE",
      height: "20em",
      padding: "0.5em",
    }
    return (
      <div>
        <h1>Server</h1>
        <Button text="Start" onClick={() => this.startServer()} />
        <Button text="Stop" onClick={() => this.stopServer()} />
        <Button text="Clear Log" onClick={() => this.clearLog()} />
        <pre style={consoleStyle} id="console">
          {this.state.events.map((e: SCServerEvent) => {
            return (<div><span className="timestamp">{e.time.toString()}</span>
              <code className={"event-" + e.type}>
                {e.data}
              </code></div>)
          })}
        </pre>
      </div>
    );
  }
}