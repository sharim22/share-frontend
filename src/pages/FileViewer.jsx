import React, {useState, useEffect} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCopy, faEye, faPlay, faFile } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

const FileViewer = () => {
  const hash = window.location.pathname.slice(1)
  const [errorMsg, setErrorMsg] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [content, setContent] = useState({ type: '', files: [], textContent: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'viewer'

  useEffect(() => {
    // Automatically try to access content when component loads
    accessContent()
  }, [])

  const accessContent = async() => {
    const payload = {
      hash: hash
    }

    try {
      const response = await axios.post('https://share-backend-mu.vercel.app/access', payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      if(response.status === 200) {
        setAuthenticated(true)
        setContent(response.data)
      } else {
        setErrorMsg('Content not found or expired!')
      }
    } catch(err) {
      console.error(err)
      setErrorMsg('Content not found or expired!')
    }
  }

  const copyText = () => {
    navigator.clipboard.writeText(content.textContent)
    const copyBtn = document.getElementById('copyText')
    copyBtn.innerHTML = "Copied!"
    setTimeout(() => {
      copyBtn.innerHTML = "Copy Text"
    }, 2000)
  }

  // Function to get file type
  const getFileType = (filename) => {
    const extension = filename.split('.').pop().toLowerCase()
    return extension
  }

  // Function to check if file is image
  const isImage = (filename) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
    return imageExtensions.includes(getFileType(filename))
  }

  // Function to check if file is video
  const isVideo = (filename) => {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']
    return videoExtensions.includes(getFileType(filename))
  }

  // Function to check if file is audio
  const isAudio = (filename) => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']
    return audioExtensions.includes(getFileType(filename))
  }

  // Function to get file icon
  const getFileIcon = (filename) => {
    if (isImage(filename)) return faEye
    if (isVideo(filename)) return faPlay
    if (isAudio(filename)) return faPlay
    return faFile
  }

  // Function to handle file view
  const handleFileView = (file) => {
    setSelectedFile(file)
    setViewMode('viewer')
  }

  // Function to go back to list
  const goBackToList = () => {
    setSelectedFile(null)
    setViewMode('list')
  }

  // Function to render media viewer
  const renderMediaViewer = () => {
    if (!selectedFile) return null

    const fileType = getFileType(selectedFile.name)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="relative max-w-4xl max-h-full w-full mx-4">
          {/* Close button */}
          <button
            onClick={goBackToList}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* File name */}
          <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            {selectedFile.name}
          </div>

          {/* Media content */}
          <div className="flex items-center justify-center h-full">
            {isImage(selectedFile.name) ? (
              <img
                src={selectedFile.url}
                alt={selectedFile.name}
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : isVideo(selectedFile.name) ? (
              <video
                src={selectedFile.url}
                controls
                className="max-w-full max-h-full"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              >
                Your browser does not support the video tag.
              </video>
            ) : isAudio(selectedFile.name) ? (
              <div className="bg-white p-8 rounded-lg">
                <audio
                  src={selectedFile.url}
                  controls
                  className="w-full"
                >
                  Your browser does not support the audio tag.
                </audio>
                <p className="text-center mt-4 text-gray-600">{selectedFile.name}</p>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg text-center">
                <FontAwesomeIcon icon={faFile} className="text-6xl text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <a
                  href={selectedFile.url}
                  download
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Download File
                </a>
              </div>
            )}

            {/* Error fallback */}
            <div style={{ display: 'none' }} className="bg-white p-8 rounded-lg text-center">
              <FontAwesomeIcon icon={faFile} className="text-6xl text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Unable to load preview</p>
              <a
                href={selectedFile.url}
                download
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Download File
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {
        authenticated ? (
          <div className='flex items-center justify-center h-screen'>
            {content.type === 'files' ? (
              /* File viewer */
              <div className="h-[600px] shadow-2xl border border-blue-500 rounded-lg p-4 w-4/5 max-w-4xl overflow-y-auto">
                {viewMode === 'list' ? (
                  <>
                    <h2 className="text-center text-2xl font-semibold mb-4">Shared Files</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {content.files.map((file, index) => (
                        <div key={index} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-3">
                            <FontAwesomeIcon 
                              icon={getFileIcon(file.name)} 
                              className={`text-2xl ${
                                isImage(file.name) ? 'text-green-500' : 
                                isVideo(file.name) ? 'text-red-500' : 
                                isAudio(file.name) ? 'text-purple-500' : 'text-gray-500'
                              }`} 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getFileType(file.name).toUpperCase()} File
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {(isImage(file.name) || isVideo(file.name) || isAudio(file.name)) ? (
                              <button
                                onClick={() => handleFileView(file)}
                                className="flex-1 bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-3 rounded inline-flex items-center justify-center"
                              >
                                <FontAwesomeIcon icon={getFileIcon(file.name)} className="mr-1" />
                                {isImage(file.name) ? 'View' : 'Play'}
                              </button>
                            ) : null}
                            
                            <a
                              href={file.url}
                              download
                              className="flex-1 bg-gray-500 hover:bg-gray-700 text-white text-sm font-bold py-2 px-3 rounded inline-flex items-center justify-center"
                            >
                              <FontAwesomeIcon icon={faDownload} className="mr-1" />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  renderMediaViewer()
                )}
              </div>
            ) : (
              /* Text content viewer */
              <div className="h-[600px] shadow-2xl border border-blue-500 rounded-lg p-6 w-4/5 max-w-4xl overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold">Shared Text</h2>
                  <button
                    id='copyText'
                    onClick={copyText}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                  >
                    <FontAwesomeIcon icon={faCopy} className="mr-2" />
                    Copy Text
                  </button>
                </div>
                <div className="bg-gray-50 p-4 rounded-md border min-h-[400px] whitespace-pre-wrap">
                  {content.textContent}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center h-screen'>
            <div className='border border-red-500 px-5 py-5 w-1/3 rounded-md text-center'>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className='text-red-600 font-bold py-2'>
                {errorMsg}
              </p>
            </div>
          </div>
        )
      }
    </>
  )
}

export default FileViewer
