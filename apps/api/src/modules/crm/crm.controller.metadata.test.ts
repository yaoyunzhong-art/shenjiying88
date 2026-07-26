import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { CrmController } from './crm.controller'

describe('CrmController metadata', () => {
  it('controller should keep api/crm path', () => {
    assert.equal(Reflect.getMetadata('path', CrmController), 'api/crm')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CrmController.prototype.listCustomers, 0, 'customers'],
      [CrmController.prototype.createCustomer, 1, 'customers'],
      [CrmController.prototype.getCustomer, 0, 'customers/:id'],
      [CrmController.prototype.updateCustomer, 2, 'customers/:id'],
      [CrmController.prototype.deleteCustomer, 3, 'customers/:id'],
      [CrmController.prototype.updateScore, 4, 'customers/:id/score'],
      [CrmController.prototype.setScore, 2, 'customers/:id/score'],
      [CrmController.prototype.addNote, 1, 'customers/:id/notes'],
      [CrmController.prototype.listNotes, 0, 'customers/:id/notes'],
      [CrmController.prototype.addTag, 1, 'customers/:id/tags'],
      [CrmController.prototype.removeTag, 3, 'customers/:id/tags/:tag'],
      [CrmController.prototype.markStatus, 4, 'customers/:id/status'],
      [CrmController.prototype.addInteraction, 1, 'customers/:id/interactions'],
      [CrmController.prototype.listInteractions, 0, 'customers/:id/interactions'],
      [CrmController.prototype.createTicket, 1, 'customers/:id/tickets'],
      [CrmController.prototype.listTickets, 0, 'customers/:id/tickets'],
      [CrmController.prototype.updateTicketStatus, 4, 'customers/:id/tickets/:ticketId'],
      [CrmController.prototype.getStats, 0, 'stats'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
