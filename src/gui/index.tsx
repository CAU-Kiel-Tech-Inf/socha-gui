import * as React          from 'react'
import { render }          from 'react-dom'
import { App }             from './App'

enum AppContent {
  Empty,
  Blank,
  GameCreation,
  GameLive,
  GameWaiting,
  Administration,
  Error,
  Log,
  Help,
  Rules,
  Quickstart,
  JavaDocs
}

export function main() {
  let location = decodeURIComponent(window.location.search.substring('?dirname='.length))
  let dir = window.localStorage['logDir']
  process.env.SGC_LOG_PATH = dir ? (dir[0] == '.' ? path.join(location, dir) : dir) : location

  //Preload viewer:
  Api.getViewer()

  window.addEventListener('beforeunload', () => {
    Api.stop()
  })
  render(
    <App/>,
    document.getElementById('root'),
  )
}

/**


 <div id="content">

 <nav className="navbar navbar-expand-lg navbar-light bg-light">
 <div className="container-fluid">

 <button type="button" id="sidebarCollapse" className="btn btn-info">
 <i className="fas fa-align-left"></i>
 <span>Toggle Sidebar</span>
 </button>
 </div>
 </nav>
 </div>

 <div className="overlay"></div>
 **/