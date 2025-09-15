import React, {useState, useEffect, useRef} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faCopy, faUpload, faDownload as faReceive, faEye, faPlay, faFile, faCloudUpload, faTimes } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

const ShareIt = () => {
    // Upload/Share states
    const [uploaded, setUploaded] = useState(false)
    const [link, setLink] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [timeLeft, setTimeLeft] = useState(0)
    const [shareType, setShareType] = useState('files')
    const [textContent, setTextContent] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [dragActive, setDragActive] = useState(false)

    // Access/Receive states
    const [accessCodeInput, setAccessCodeInput] = useState(['', '', '', '', '', ''])
    const [errorMsg, setErrorMsg] = useState('')
    const [authenticated, setAuthenticated] = useState(false)
    const [content, setContent] = useState({ type: '', files: [], textContent: '' })
    const [selectedFile, setSelectedFile] = useState(null)
    const [viewMode, setViewMode] = useState('list')

    // Page mode: 'send' or 'receive'
    const [pageMode, setPageMode] = useState('send')

    // Refs for OTP inputs
    const inputRefs = useRef([])
    const fileInputRef = useRef(null)

    // File upload limitations - INCREASED LIMITS
    const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB (increased from 50MB)
    const MAX_FILES = 50 // increased from 10
    const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024 // 2GB total size limit
    const ALLOWED_TYPES = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
        // Videos
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/mkv', 'video/flv', 'video/3gp',
        // Audio
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a', 'audio/wma',
        // Documents
        'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv', 'application/rtf',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip',
        // Code files
        'text/html', 'text/css', 'text/javascript', 'application/javascript', 'text/x-python', 'text/x-java-source',
        'application/json', 'text/xml', 'application/xml'
    ]

    useEffect(() => {
        let timer
        if (timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [timeLeft])

    // File handling functions
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getTotalSize = (files) => {
        return files.reduce((total, file) => total + file.size, 0)
    }

    const validateFile = (file) => {
        const errors = []
        
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`${file.name}: File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`)
        }
        
        if (!ALLOWED_TYPES.includes(file.type)) {
            errors.push(`${file.name}: File type not supported`)
        }
        
        return errors
    }

    const handleFileSelect = (files) => {
        const fileArray = Array.from(files)
        const errors = []
        const validFiles = []

        // Check total number of files
        if (selectedFiles.length + fileArray.length > MAX_FILES) {
            errors.push(`Maximum ${MAX_FILES} files allowed`)
        }

        // Check total size
        const currentTotalSize = getTotalSize(selectedFiles)
        const newFilesTotalSize = getTotalSize(fileArray)
        if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE) {
            errors.push(`Total size exceeds ${formatFileSize(MAX_TOTAL_SIZE)} limit`)
        }

        // Validate each file
        fileArray.forEach(file => {
            const fileErrors = validateFile(file)
            if (fileErrors.length === 0) {
                validFiles.push(file)
            } else {
                errors.push(...fileErrors)
            }
        })

        if (errors.length > 0) {
            alert(errors.join('\n'))
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles])
        }
    }

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files)
        }
    }

    // OTP input handlers
    const handleOTPChange = (index, value) => {
        if (value.length > 1) return // Prevent multiple characters
        
        const newOTP = [...accessCodeInput]
        newOTP[index] = value
        setAccessCodeInput(newOTP)

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleOTPKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !accessCodeInput[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleOTPPaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
        const newOTP = [...accessCodeInput]
        
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newOTP[i] = pastedData[i]
        }
        
        setAccessCodeInput(newOTP)
        
        // Focus the next empty input or the last input
        const nextIndex = Math.min(pastedData.length, 5)
        inputRefs.current[nextIndex]?.focus()
    }

    // Upload/Share functions
    const handleFileUpload = async(e) => {
        e.preventDefault()
        
        if (selectedFiles.length === 0) {
            alert('Please select at least one file')
            return
        }

        setIsUploading(true)
        
        const formData = new FormData()
        selectedFiles.forEach(file => {
            formData.append('files', file)
        })

        try {
            const response = await axios.post("https://share-backend-swart.vercel.app/upload/files", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            setLink(window.location.origin + '/' + response.data.hash)
            setAccessCode(response.data.accessCode)
            setTimeLeft(response.data.expiresIn)
            setUploaded(true)
        } catch(err) {
            console.error(err)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleTextUpload = async(e) => {
        e.preventDefault()
        setIsUploading(true)

        try {
            const response = await axios.post("https://share-backend-swart.vercel.app/upload/text", {
                textContent: textContent
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
            setLink(window.location.origin + '/' + response.data.hash)
            setAccessCode(response.data.accessCode)
            setTimeLeft(response.data.expiresIn)
            setUploaded(true)
        } catch(err) {
            console.error(err)
            alert('Text sharing failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleCancel = () => {
        setUploaded(false)
        setLink('')
        setAccessCode('')
        setTimeLeft(0)
        setTextContent('')
        setShareType('files')
        setIsUploading(false)
        setSelectedFiles([])
    }

    // Access/Receive functions
    const accessContent = async(e) => {
        e.preventDefault()
        
        const code = accessCodeInput.join('')
        if (code.length !== 6) {
            setErrorMsg('Please enter a complete 6-digit code')
            return
        }

        const payload = {
            accessCode: code
        }

        try {
            const response = await axios.post('https://share-backend-swart.vercel.app/access/code', payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
            if(response.status === 200) {
                setAuthenticated(true)
                setContent(response.data)
                setErrorMsg('')
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

    const copyLink = () => {
        navigator.clipboard.writeText(link)
        const copyBtn = document.getElementById('copy')
        copyBtn.innerHTML = "Copied!"
        setTimeout(() => {
            copyBtn.innerHTML = "Copy"
        }, 5000)
    }

    const copyAccessCode = () => {
        navigator.clipboard.writeText(accessCode)
        const copyCodeBtn = document.getElementById('copyCode')
        copyCodeBtn.innerHTML = "Copied!"
        setTimeout(() => {
            copyCodeBtn.innerHTML = "Copy Code"
        }, 5000)
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const resetReceive = () => {
        setAuthenticated(false)
        setContent({ type: '', files: [], textContent: '' })
        setAccessCodeInput(['', '', '', '', '', ''])
        setErrorMsg('')
        setSelectedFile(null)
        setViewMode('list')
    }

    // Function to split access code into individual digits
    const getAccessCodeDigits = () => {
        return accessCode.split('').map(digit => digit || '')
    }

    // File type functions
    const getFileType = (filename) => {
        const extension = filename.split('.').pop().toLowerCase()
        return extension
    }

    const isImage = (filename) => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff']
        return imageExtensions.includes(getFileType(filename))
    }

    const isVideo = (filename) => {
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp']
        return videoExtensions.includes(getFileType(filename))
    }

    const isAudio = (filename) => {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
        return audioExtensions.includes(getFileType(filename))
    }

    const getFileIcon = (filename) => {
        if (isImage(filename)) return faEye
        if (isVideo(filename)) return faPlay
        if (isAudio(filename)) return faPlay
        return faFile
    }

    const handleFileView = (file) => {
        setSelectedFile(file)
        setViewMode('viewer')
    }

    const goBackToList = () => {
        setSelectedFile(null)
        setViewMode('list')
    }

    // Function to render media viewer
    const renderMediaViewer = () => {
        if (!selectedFile) return null

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
        <div className='min-h-screen bg-gray-50'>
            {/* Header */}
            <div className='bg-blue-600 text-white py-4'>
                <div className='max-w-4xl mx-auto px-4'>
                    <h1 className='text-3xl font-bold text-center'>ShareIt</h1>
                    <p className='text-center text-blue-100 mt-2'>Share files and text instantly with access codes</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className='max-w-4xl mx-auto px-4 py-6'>
                <div className='flex justify-center space-x-4 mb-8'>
                    <button
                        onClick={() => setPageMode('send')}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                            pageMode === 'send' 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        <FontAwesomeIcon icon={faUpload} />
                        <span>Send Content</span>
                    </button>
                    <button
                        onClick={() => setPageMode('receive')}
                        className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                            pageMode === 'receive' 
                                ? 'bg-blue-600 text-white shadow-lg' 
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        <FontAwesomeIcon icon={faReceive} />
                        <span>Receive Content</span>
                    </button>
                </div>

                {/* Send Content Section */}
                {pageMode === 'send' && (
                    <div className='bg-white rounded-lg shadow-lg p-6'>
                        <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>Share Your Content</h2>
                        
                        {!uploaded ? (
                            <div>
                                {/* Share Type Toggle */}
                                <div className='mb-6 flex justify-center space-x-2'>
                                    <button
                                        type='button'
                                        onClick={() => setShareType('files')}
                                        className={`px-4 py-2 rounded-md font-medium ${
                                            shareType === 'files' 
                                                ? 'bg-blue-700 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Share Files
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => setShareType('text')}
                                        className={`px-4 py-2 rounded-md font-medium ${
                                            shareType === 'text' 
                                                ? 'bg-blue-700 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Share Text
                                    </button>
                                </div>

                                <form onSubmit={shareType === 'files' ? handleFileUpload : handleTextUpload}>
                                    {shareType === 'files' ? (
                                        <div className='mb-6'>
                                            {/* File Upload Area */}
                                            <div
                                                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                                    dragActive 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                                onDragEnter={handleDrag}
                                                onDragLeave={handleDrag}
                                                onDragOver={handleDrag}
                                                onDrop={handleDrop}
                                            >
                                                <input
                                                    ref={fileInputRef}
                                                    type='file'
                                                    name='files'
                                                    multiple
                                                    onChange={(e) => handleFileSelect(e.target.files)}
                                                    className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                                                    accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.html,.css,.js,.py,.java,.json,.xml"
                                                />
                                                
                                                <div className='space-y-4'>
                                                    <FontAwesomeIcon 
                                                        icon={faCloudUpload} 
                                                        className='text-4xl text-gray-400 mx-auto' 
                                                    />
                                                    <div>
                                                        <p className='text-lg font-medium text-gray-700'>
                                                            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
                                                        </p>
                                                        <p className='text-sm text-gray-500 mt-1'>
                                                            Images, Videos, Audio, Documents, Archives, Code files
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Enhanced File Limitations */}
                                                    <div className='bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 text-sm text-gray-700'>
                                                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                                                            <div className='flex items-center justify-between bg-white rounded p-2'>
                                                                <span className='text-xs'>Max file size:</span>
                                                                <span className='font-bold text-green-600'>{formatFileSize(MAX_FILE_SIZE)}</span>
                                                            </div>
                                                            <div className='flex items-center justify-between bg-white rounded p-2'>
                                                                <span className='text-xs'>Max files:</span>
                                                                <span className='font-bold text-blue-600'>{MAX_FILES}</span>
                                                            </div>
                                                            <div className='flex items-center justify-between bg-white rounded p-2'>
                                                                <span className='text-xs'>Total limit:</span>
                                                                <span className='font-bold text-purple-600'>{formatFileSize(MAX_TOTAL_SIZE)}</span>
                                                            </div>
                                                        </div>
                                                        <div className='mt-2 text-xs text-gray-600 text-center'>
                                                            Current: {formatFileSize(getTotalSize(selectedFiles))} / {formatFileSize(MAX_TOTAL_SIZE)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected Files List */}
                                            {selectedFiles.length > 0 && (
                                                <div className='mt-4'>
                                                    <div className='flex items-center justify-between mb-3'>
                                                        <h3 className='text-sm font-medium text-gray-700'>
                                                            Selected Files ({selectedFiles.length}/{MAX_FILES})
                                                        </h3>
                                                        <div className='text-xs text-gray-500'>
                                                            Total: {formatFileSize(getTotalSize(selectedFiles))}
                                                        </div>
                                                    </div>
                                                    <div className='space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2'>
                                                        {selectedFiles.map((file, index) => (
                                                            <div key={index} className='flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors'>
                                                                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                                                                    <FontAwesomeIcon 
                                                                        icon={getFileIcon(file.name)} 
                                                                        className='text-blue-500 flex-shrink-0' 
                                                                    />
                                                                    <div className='flex-1 min-w-0'>
                                                                        <p className='text-sm font-medium text-gray-900 truncate' title={file.name}>
                                                                            {file.name}
                                                                        </p>
                                                                        <p className='text-xs text-gray-500'>
                                                                            {formatFileSize(file.size)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type='button'
                                                                    onClick={() => removeFile(index)}
                                                                    className='text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded'
                                                                >
                                                                    <FontAwesomeIcon icon={faTimes} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <textarea
                                            name='textContent'
                                            placeholder='Enter your text here...'
                                            value={textContent}
                                            onChange={(e) => setTextContent(e.target.value)}
                                            className='mb-4 border border-gray-300 rounded-md w-full py-3 px-3 h-32 resize-none'
                                            required
                                        />
                                    )}
                                    
                                    <div className='flex justify-center'>
                                        <input
                                            type='submit'
                                            value={isUploading ? "Uploading..." : "Upload & Share"}
                                            disabled={isUploading || (shareType === 'files' && selectedFiles.length === 0)}
                                            className='bg-blue-700 hover:bg-blue-900 text-white py-3 px-8 rounded-md disabled:opacity-50 font-medium'
                                        />
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className='space-y-6'>
                                {/* Success Message */}
                                <div className='flex items-center justify-between rounded-lg text-white px-6 py-4 bg-green-500'>
                                    <div className='flex items-center space-x-3'>
                                        <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center'>
                                            <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                                            </svg>
                                        </div>
                                        <p className='text-xl font-medium'>Success! Content Shared</p>
                                    </div>
                                    <button
                                        id='copy'
                                        className='px-4 py-2 bg-white rounded-lg shadow-lg text-green-500 hover:bg-gray-50 font-medium'
                                        onClick={copyLink}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                                
                                {/* Access Code Display - OTP Style */}
                                <div className='bg-blue-50 rounded-lg p-6 border-2 border-blue-200'>
                                    <div className='text-center mb-4'>
                                        <p className='text-sm font-medium text-blue-700 mb-2'>Share this access code with others:</p>
                                        
                                        {/* OTP Style Display */}
                                        <div className='flex justify-center space-x-3 mb-4'>
                                            {getAccessCodeDigits().map((digit, index) => (
                                                <div
                                                    key={index}
                                                    className='w-14 h-14 bg-blue-600 text-white text-2xl font-bold rounded-lg flex items-center justify-center shadow-lg'
                                                >
                                                    {digit}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button
                                            id='copyCode'
                                            className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg'
                                            onClick={copyAccessCode}
                                        >
                                            Copy Access Code
                                        </button>
                                    </div>
                                </div>

                                {/* Timer */}
                                <div className='flex items-center justify-center rounded-lg text-white px-6 py-4 bg-red-500'>
                                    <div className='text-center'>
                                        <p className='text-sm font-medium mb-1'>Content will be deleted in:</p>
                                        <p className='text-3xl font-bold'>{formatTime(timeLeft)}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className='flex space-x-4'>
                                    <button
                                        onClick={handleCancel}
                                        className='flex-1 bg-gray-500 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium'
                                    >
                                        Share New Content
                                    </button>
                                    <button
                                        onClick={() => setPageMode('receive')}
                                        className='flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium'
                                    >
                                        Switch to Receive
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Receive Content Section */}
                {pageMode === 'receive' && (
                    <div className='bg-white rounded-lg shadow-lg p-6'>
                        <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>Access Shared Content</h2>
                        
                        {!authenticated ? (
                            <form onSubmit={accessContent}>
                                <div className='mb-6'>
                                    <label className='block text-sm font-medium text-gray-700 mb-4 text-center'>
                                        Enter 6-digit Access Code
                                    </label>
                                    
                                    {/* OTP Input Boxes */}
                                    <div className='flex justify-center space-x-3 mb-4'>
                                        {accessCodeInput.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type='text'
                                                inputMode='numeric'
                                                pattern='[0-9]*'
                                                maxLength='1'
                                                value={digit}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                                onPaste={handleOTPPaste}
                                                className='w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200'
                                                required
                                            />
                                        ))}
                                    </div>
                                    
                                    <p className='text-xs text-gray-500 text-center'>
                                        You can paste the complete code or type digit by digit
                                    </p>
                                </div>
                                
                                {errorMsg.length > 0 && (
                                    <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center'>
                                        {errorMsg}
                                    </div>
                                )}
                                
                                <div className='flex justify-center'>
                                    <input 
                                        type='submit'
                                        value='Access Content'
                                        className='bg-blue-700 hover:bg-blue-900 text-white py-3 px-8 rounded-md font-medium'
                                    />
                                </div>
                            </form>
                        ) : (
                            <div>
                                {content.type === 'files' ? (
                                    /* File viewer with media support */
                                    <div className="border border-gray-300 rounded-lg p-4">
                                        {viewMode === 'list' ? (
                                            <>
                                                <h3 className="text-xl font-semibold mb-4 text-center">Shared Files</h3>
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
                                    <div className="border border-gray-300 rounded-lg p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xl font-semibold">Shared Text</h3>
                                            <button
                                                id='copyText'
                                                onClick={copyText}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                                            >
                                                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                                                Copy Text
                                            </button>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-md border min-h-[200px] whitespace-pre-wrap">
                                            {content.textContent}
                                        </div>
                                    </div>
                                )}

                                <div className='flex space-x-4 mt-6'>
                                    <button
                                        onClick={resetReceive}
                                        className='flex-1 bg-gray-500 hover:bg-gray-700 text-white py-3 px-4 rounded-md font-medium'
                                    >
                                        Access New Content
                                    </button>
                                    <button
                                        onClick={() => setPageMode('send')}
                                        className='flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium'
                                    >
                                        Switch to Send
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ShareIt 