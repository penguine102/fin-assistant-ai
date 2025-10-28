import React from 'react'
import { Card } from 'antd'

const OCRHistoryPage: React.FC = () => {
  return (
    <div>
      <Card>
        <h2>OCR History</h2>
        <p>This page will display OCR processing history.</p>
        <p>Note: Get OCR history API endpoint is not implemented yet in backend.</p>
        <p>Currently, OCR results are integrated into chat sessions.</p>
      </Card>
    </div>
  )
}

export default OCRHistoryPage

