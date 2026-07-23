import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Page from './page'

describe('/app/gadgets', () => {
  it('renders without crashing', () => {
    const { container } = render(<Page />)
    expect(container).toBeDefined()
  })
})
