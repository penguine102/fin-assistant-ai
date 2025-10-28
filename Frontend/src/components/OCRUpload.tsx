import React, { useState } from 'react'
import { Modal, Upload, Button, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import api from '../services/api'

interface OCRUploadProps {
  visible: boolean
  onCancel: () => void
  sessionId: string
  userId: string
  onSuccess?: (result?: any) => void
}

const { Dragger } = Upload

const OCRUpload: React.FC<OCRUploadProps> = ({ visible, onCancel, sessionId, userId, onSuccess }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    console.log('handleUpload called, fileList:', fileList)
    
    if (fileList.length === 0) {
      message.warning('Vui lòng chọn file để upload')
      return
    }

    setUploading(true)

    try {
      const file = fileList[0].originFileObj
      console.log('File from fileList:', file)
      console.log('fileList[0]:', fileList[0])
      
      if (!file) {
        console.error('originFileObj is undefined')
        message.error('File không hợp lệ')
        return
      }

      const formData = new FormData()
      // Explicitly set content type for the file
      formData.append('file', file, file.name)
      formData.append('session_id', sessionId)
      formData.append('user_id', userId)
      formData.append('debug', 'true')

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }

      const result = await api.uploadReceipt(formData)
      
      message.success('Upload thành công! OCR đã được xử lý.')
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      // Reset và đóng
      setFileList([])
      onCancel()
    } catch (error: any) {
      console.error('Upload error:', error)
      message.error(error.response?.data?.detail || 'Upload thất bại')
    } finally {
      setUploading(false)
    }
  }

  const uploadProps = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    },
    beforeUpload: (file: File) => {
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      })
      
      // Get file extension
      const fileName = file.name.toLowerCase()
      const validExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.pdf']
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
      
      // Validate file type (MIME type or extension fallback)
      const isValidType = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'].includes(file.type) || hasValidExtension
      
      if (!isValidType) {
        console.log('Invalid file type:', file.type, 'Extension check:', hasValidExtension)
        message.error(`Chỉ chấp nhận file JPEG, PNG, HEIC hoặc PDF. File hiện tại: ${file.type || 'unknown type'}`)
        return false
      }

      // Validate file size (5MB)
      const isLt5M = file.size / 1024 / 1024 < 5
      if (!isLt5M) {
        message.error('File size phải nhỏ hơn 5MB')
        return false
      }

      console.log('File validation passed')
      // Create UploadFile object
      const uploadFile: UploadFile = {
        uid: `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        originFileObj: file as any,
      }
      setFileList([uploadFile])
      return false // Prevent auto upload
    },
    fileList,
    maxCount: 1,
  }

  return (
    <Modal
      title="Upload Hóa Đơn"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>Hủy</Button>,
        <Button 
          key="upload" 
          type="primary" 
          loading={uploading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          Upload
        </Button>,
      ]}
    >
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click hoặc kéo file vào đây để upload</p>
        <p className="ant-upload-hint">
          Hỗ trợ: JPEG, PNG, HEIC, PDF (tối đa 5MB)
        </p>
      </Dragger>
    </Modal>
  )
}

export default OCRUpload

