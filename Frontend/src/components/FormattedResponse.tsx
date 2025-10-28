import React, { useMemo, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ParsedSection {
  type: 'context' | 'analysis' | 'recommendation' | 'risk'
  title: string
  content: string[]
}

interface FormattedResponseProps {
  content: string
}

const FormattedResponse: React.FC<FormattedResponseProps> = ({ content }) => {
  const [accumulatedSections, setAccumulatedSections] = useState<ParsedSection[]>([])
  
  // Parse response into structured sections
  const parseResponse = (text: string): ParsedSection[] => {
    const sections: ParsedSection[] = []
    
    // Match sections with keywords - ORDER MATTERS! More specific first
    // Based on system.txt: "Bối cảnh ngắn", "Phân tích chính", "Khuyến nghị hành động", "Rủi ro và điểm kiểm soát"
    const sectionPatterns = [
      { 
        keywords: ['Rủi ro và điểm kiểm soát', 'Rủi ro/Điểm theo dõi', 'Rủi ro/Điểm kiểm soát', 'Rủi ro và điểm theo dõi'],
        regex: /^.*[Rr]ủi [Rr]o.*[đĐ]i?ểm.*k/i,
        type: 'risk' as const, 
        title: '⚠️ Rủi ro/Điểm theo dõi' 
      },
      { 
        keywords: ['Bối cảnh ngắn', 'Bối cảnh:', 'Bối cảnh', '- Bối cảnh:', '- Bối cảnh', 'Bối cảnh ngắn:'],
        regex: /^.*[Bb]ối\s+[Cc]ảnh/i,
        type: 'context' as const, 
        title: '📌 Bối cảnh' 
      },
      { 
        keywords: ['Phân tích chính', 'Phân tích:'],
        regex: /^.*[Pp]hân [Tt]ích.*$/i,
        type: 'analysis' as const, 
        title: '📊 Phân tích' 
      },
      { 
        keywords: ['Khuyến nghị hành động', 'Khuyến nghị:', 'Hành động'],
        regex: /^.*[Kk]huyến [Nn]ghị.*$/i,
        type: 'recommendation' as const, 
        title: '💡 Khuyến nghị' 
      },
      { 
        keywords: ['Rủi ro'], 
        regex: /^.*[Rr]ủi [Rr]o.*$/i,
        type: 'risk' as const, 
        title: '⚠️ Rủi ro' 
      },
      { 
        keywords: ['Điểm theo dõi'], 
        regex: /^.*[ĐĐ]i?ểm.*[Tt]heo.*[Dd]õi.*$/i,
        type: 'risk' as const, 
        title: '⚠️ Điểm theo dõi' 
      },
    ]
    
    const lines = text.split('\n')
    let currentSection: ParsedSection | null = null
    
    for (const line of lines) {
      let matched = false
      let matchedPattern: typeof sectionPatterns[0] | null = null
      
      // Find the FIRST pattern that matches (should be most specific)
      // Try regex first, then fallback to keywords
      for (const pattern of sectionPatterns) {
        const regexMatch = pattern.regex?.test(line)
        const keywordMatch = pattern.keywords.some(keyword => line.includes(keyword))
        const lineMatches = regexMatch || keywordMatch
        
        if (lineMatches) {
          matched = true
          matchedPattern = pattern
          break
        }
      }
      
      if (matched && matchedPattern) {
        // Save previous section if exists AND has content
        if (currentSection && currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        
        // Check if this section type already exists
        const existingSection = sections.find(s => s.type === matchedPattern.type)
        if (existingSection) {
          // Merge content into existing section instead of creating new one
          currentSection = existingSection
        } else {
          // Start new section
          currentSection = {
            type: matchedPattern.type,
            title: matchedPattern.title,
            content: []
          }
        }
        
        // IMPORTANT: Add the current line to the new/existing section
        const trimmedLine = line.trim()
        if (trimmedLine) {
          currentSection.content.push(trimmedLine)
        }
      } else if (!matched && currentSection) {
        // Add line to current section (skip empty lines)
        const trimmedLine = line.trim()
        if (trimmedLine) {
          currentSection.content.push(trimmedLine)
        }
      }
    }
    
    // Add last section - but be more lenient for first section
    if (currentSection) {
      // Always add the current section, even if it has no content yet (for streaming)
      if (currentSection.content.length > 0 || sections.length === 0) {
        sections.push(currentSection)
      }
    }
    
    return sections
  }

  // Update accumulated sections when content changes
  useEffect(() => {
    const newSections = parseResponse(content)
    
    // Merge with existing sections to preserve content during streaming
    setAccumulatedSections(prevSections => {
      const mergedSections: ParsedSection[] = []
      
      // Keep existing sections and update their content
      for (const prevSection of prevSections) {
        const newSection = newSections.find(s => s.type === prevSection.type)
        if (newSection && newSection.content.length > prevSection.content.length) {
          // Update with longer content
          mergedSections.push(newSection)
        } else {
          // Keep existing section
          mergedSections.push(prevSection)
        }
      }
      
      // Add new sections that don't exist yet
      for (const newSection of newSections) {
        if (!mergedSections.find(s => s.type === newSection.type)) {
          mergedSections.push(newSection)
        }
      }
      
      return mergedSections
    })
  }, [content])
  
  
  // If no sections found, render as plain text
  if (accumulatedSections.length === 0) {
    return <div>{content}</div>
  }

  return (
    <div className="formatted-response">
      {accumulatedSections.map((section, idx) => (
        <div key={`${section.type}-${idx}`} className={`response-section section-${section.type}`}>
          <div className="section-header">
            <h3 className="section-title">{section.title}</h3>
          </div>
          <div className="section-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content.join('\n')}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  )
}

export default FormattedResponse
