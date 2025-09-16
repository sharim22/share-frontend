import React, {useState} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCopy } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

const AccessCodeViewer = () => {
  const [accessCode, setAccessCode] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [content, setContent] = useState({ type: '', files: [], textContent: '' })

  const accessContent = async(e) => {
    e.preventDefault()

    const payload = {
      accessCode: accessCode
    }

    try {
      const response = await axios.post('https://share-backend-mu.vercel.app/access/code', payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      if(response.status === 200) {
        setAuthenticated(true)
        setContent(response.data)
      } else {
        setErrorMsg('Invalid access code!')
      }
    } catch(err) {
      console.error(err)
      setErrorMsg('Invalid access code!')
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

  return (
    <>
      {
        authenticated ? (
          <div className='flex items-center justify-center h-screen'>
            {content.type === 'files' ? (
              /* File downloader */
              <div className="h-[450px] shadow-2xl border border-blue-500 rounded-lg table-auto p-3 w-2/5 overflow-y-auto">
                <table className='w-full'>
                  <caption className="text-center text-2xl font-semibold mb-2">Download Files</caption>
                  <tbody>
                    {
                      content.files.map((file, index) => {
                        return (
                          <tr key={index}>
                            <td className="border px-4 py-2">{file.name}</td>
                            <td className="border px-4 py-2 text-right">
                              <a
                                href={file.url}
                                rel="noopener noreferrer"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                                download
                              >
                                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                                Download
                              </a>
                            </td>
                          </tr>
                        )
                      })
                    }
                  </tbody>
                </table>
              </div>
            ) : (
              /* Text content viewer */
              <div className="h-[450px] shadow-2xl border border-blue-500 rounded-lg p-6 w-2/5 overflow-y-auto">
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
                <div className="bg-gray-50 p-4 rounded-md border min-h-[300px] whitespace-pre-wrap">
                  {content.textContent}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center h-screen'>
            {/* request access code */}
            <form className='border border-blue-500 px-5 py-5 w-1/3 rounded-md' onSubmit={accessContent}>
              <h2 className="text-2xl font-bold text-center mb-4">Enter Access Code</h2>
              <input
                type='text'
                name='accessCode'
                placeholder='Enter 6-digit access code'
                onChange={(e) => setAccessCode(e.target.value)}
                className='w-full py-3 px-3 border border-gray-500 rounded-md mb-3 text-center text-xl font-bold'
                maxLength="6"
                required
              />
              {
                errorMsg.length > 0 && (
                  <p className='text-red font-bold py-2'>
                    {errorMsg}
                  </p>
                )
              }
              <input 
                type='submit'
                value='Access Content'
                className='w-full bg-blue-700 hover:bg-blue-900 rounded-md text-white py-3'
              />
            </form>
          </div>
        )
      }
    </>
  )
}

export default AccessCodeViewer 