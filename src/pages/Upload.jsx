import React, {useState, useEffect} from 'react'
import axios from 'axios'

const Upload = () => {
    const [uploaded, setUploaded] = useState(false)
    const [link, setLink] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [timeLeft, setTimeLeft] = useState(0)
    const [shareType, setShareType] = useState('files') // 'files' or 'text'
    const [textContent, setTextContent] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        let timer
        if (timeLeft > 0) {
            timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [timeLeft])

    const handleFileUpload = async(e) => {
        e.preventDefault()
        setIsUploading(true)
        
        const files = document.getElementsByName('files')[0].files
        const formData = new FormData()
        for(let i=0; i < files.length; i++) {
            formData.append('files', files[i])
        }

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

    return (
        <div className='flex items-center justify-center h-screen'>
            <div className='border border-blue-200 rounded-md p-3 w-1/3'>
                {!uploaded ? (
                    <div>
                        {/* Share Type Toggle */}
                        <div className='mb-4 flex space-x-2'>
                            <button
    return (
        <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 px-2 sm:px-0'>
            <div className='bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-auto'>
                {!uploaded ? (
                    <div>
                        {/* Share Type Toggle */}
                        <div className='mb-4 flex space-x-2'>
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
                                <input 
                                    type='file'
                                    name='files'
                                    multiple
                                    className='mb-2 border border-gray-300 rounded-md w-full py-3 px-3'
                                    required
                                />
                            ) : (
                                <textarea
                                    name='textContent'
                                    placeholder='Enter your text here...'
                                    value={textContent}
                                    onChange={(e) => setTextContent(e.target.value)}
                                    className='mb-2 border border-gray-300 rounded-md w-full py-3 px-3 h-32 resize-none'
                                    required
                                />
                            )}
                            
                            <div className='flex space-x-2'>
                                <input
                                    type='submit'
                                    value={isUploading ? "Uploading..." : "Upload"}
                                    disabled={isUploading}
                                    className='flex-1 bg-blue-700 hover:bg-blue-900 text-white py-3 px-3 rounded-md disabled:opacity-50'
                                />
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className='mt-5 space-y-3'>
                        <div className='flex items-center justify-between rounded-md text-white px-3 py-3 bg-green-500 w-full'>
                            <p className='text-xl'>Success</p>
                            <button
                                id='copy'
                                className='p-1 bg-white rounded-md shadow-2xl text-green-500'
                                onClick={copyLink}
                            >
                                Copy Link
                            </button>
                        </div>
                        
                        <div className='flex items-center justify-between rounded-md text-white px-3 py-3 bg-blue-500 w-full'>
                            <div>
                                return (
                                    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100 px-2 sm:px-0'>
                                        <div className='bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md mx-auto'>
                                            {!uploaded ? (
                                                <div>
                                                    {/* Share Type Toggle */}
                                                    <div className='mb-4 flex space-x-2'>
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
                                                            <input 
                                                                type='file'
                                                                name='files'
                                                                multiple
                                                                className='mb-2 border border-gray-300 rounded-md w-full py-3 px-3'
                                                                required
                                                            />
                                                        ) : (
                                                            <textarea
                                                                name='textContent'
                                                                placeholder='Enter your text here...'
                                                                value={textContent}
                                                                onChange={(e) => setTextContent(e.target.value)}
                                                                className='mb-2 border border-gray-300 rounded-md w-full py-3 px-3 h-32 resize-none'
                                                                required
                                                            />
                                                        )}
                                                        <div className='flex space-x-2'>
                                                            <input
                                                                type='submit'
                                                                value={isUploading ? "Uploading..." : "Upload"}
                                                                disabled={isUploading}
                                                                className='flex-1 bg-blue-700 hover:bg-blue-900 text-white py-3 px-3 rounded-md disabled:opacity-50'
                                                            />
                                                        </div>
                                                    </form>
                                                </div>
                                            ) : (
                                                <div className='mt-5 space-y-3'>
                                                    <div className='flex items-center justify-between rounded-md text-white px-3 py-3 bg-green-500 w-full'>
                                                        <p className='text-xl'>Success</p>
                                                        <button
                                                            id='copy'
                                                            className='p-1 bg-white rounded-md shadow-2xl text-green-500'
                                                            onClick={copyLink}
                                                        >
                                                            Copy Link
                                                        </button>
                                                    </div>
                                                    <div className='flex items-center justify-between rounded-md text-white px-3 py-3 bg-blue-500 w-full'>
                                                        <div>
                                                            <p className='text-sm'>Access Code:</p>
                                                            <p className='text-xl font-bold'>{accessCode}</p>
                                                        </div>
                                                        <button
                                                            id='copyCode'
                                                            className='p-1 bg-white rounded-md shadow-2xl text-blue-500'
                                                            onClick={copyAccessCode}
                                                        >
                                                            Copy Code
                                                        </button>
                                                    </div>
                                                    <div className='flex items-center justify-center rounded-md text-white px-3 py-3 bg-red-500 w-full'>
                                                        <div className='text-center'>
                                                            <p className='text-sm'>Content will be deleted in:</p>
                                                            <p className='text-xl font-bold'>{formatTime(timeLeft)}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleCancel}
                                                        className='w-full bg-gray-500 hover:bg-gray-700 text-white py-3 px-3 rounded-md'
                                                    >
                                                        Cancel & Start New
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                }
