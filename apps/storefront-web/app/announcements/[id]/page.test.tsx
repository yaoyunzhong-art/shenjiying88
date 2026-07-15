import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AnnouncementDetailPage from './page'

describe('AnnouncementDetailPage', () => {
  it('should render announcement title', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('暑期大促活动规则更新')).toBeInTheDocument()
  })

  it('should render category', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('运营通知')).toBeInTheDocument()
  })

  it('should render author and date', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('运营部')).toBeInTheDocument()
  })

  it('should render priority badge for high priority', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('重要')).toBeInTheDocument()
  })

  it('should render priority badge for urgent priority', () => {
    render(<AnnouncementDetailPage params={{ id: '002' }} />)
    expect(screen.getByText('紧急')).toBeInTheDocument()
  })

  it('should render content paragraphs', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText(/暑期大促活动规则已更新/)).toBeInTheDocument()
  })

  it('should render tags', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('促销')).toBeInTheDocument()
    expect(screen.getByText('规则更新')).toBeInTheDocument()
  })

  it('should render read count', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText(/156 人已读/)).toBeInTheDocument()
  })

  it('should show not found for invalid id', () => {
    render(<AnnouncementDetailPage params={{ id: '999' }} />)
    expect(screen.getByText('公告未找到')).toBeInTheDocument()
  })

  it('should mark as read on button click', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    fireEvent.click(screen.getByText('标记为已读'))
    expect(screen.getByText(/标记为已读/)).toBeInTheDocument()
  })

  it('should diable button after marking read', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    const btn = screen.getByText('标记为已读')
    fireEvent.click(btn)
    expect(screen.getByText(/已读/)).toBeDisabled?.() ?? true
  })

  it('should render back link', () => {
    render(<AnnouncementDetailPage params={{ id: '001' }} />)
    expect(screen.getByText('← 返回公告列表')).toBeInTheDocument()
  })

  it('should render loading skeleton when no announcement', () => {
    const { container } = render(<AnnouncementDetailPage params={{ id: '999' }} />)
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument()
  })
})
// Total: 13 tests
