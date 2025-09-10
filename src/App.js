import {Routes, Route} from 'react-router-dom'
import ShareIt from './pages/ShareIt'
import FileViewer from './pages/FileViewer'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={ <ShareIt /> } />
        <Route path="/:path" element={ <FileViewer /> } />
      </Routes>
    </div>
  );
}

export default App;
