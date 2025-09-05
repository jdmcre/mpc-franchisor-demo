'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Plus, Edit, X } from 'lucide-react'
import { DataService } from '@/lib/data-service'
import { MarketUpdate } from '@/lib/supabase'

interface MarketUpdateFormProps {
  marketId?: string
  marketName?: string
  onUpdate: () => void
  editingUpdate?: MarketUpdate | null
  onCancelEdit?: () => void
  isCompact?: boolean
}

export function MarketUpdateForm({ 
  marketId, 
  marketName, 
  onUpdate, 
  editingUpdate,
  onCancelEdit,
  isCompact = false
}: MarketUpdateFormProps) {
  const [message, setMessage] = useState(editingUpdate?.message || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update message when editingUpdate changes
  React.useEffect(() => {
    setMessage(editingUpdate?.message || '')
  }, [editingUpdate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() || !marketId) return

    setIsSubmitting(true)
    
    try {
      if (editingUpdate) {
        // Update existing update
        await DataService.updateMarketUpdate(editingUpdate.id, message)
      } else {
        // Create new update
        await DataService.createMarketUpdate(marketId, 'Merida Partners', message)
      }
      
      setMessage('')
      onCancelEdit?.()
      // Note: onUpdate() not called since realtime will handle UI updates
    } catch (error) {
      console.error('Error saving market update:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setMessage('')
    onCancelEdit?.()
  }

  if (isCompact) {
    return (
      <form onSubmit={handleSubmit} className="space-y-3">
        {editingUpdate && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
            <span className="text-sm text-gray-600">Editing message</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={editingUpdate ? "Edit your message..." : "Type your message..."}
              className="min-h-[40px] max-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isSubmitting}
              required
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (message.trim() && !isSubmitting) {
                    handleSubmit(e)
                  }
                }
              }}
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !message.trim()}
            className="px-4 py-2"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {editingUpdate ? (
            <>
              <Edit className="h-4 w-4" />
              Edit Update
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Update
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your market update..."
              className="min-h-[100px]"
              disabled={isSubmitting}
              required
            />
          </div>

          {marketName && (
            <div className="text-sm text-muted-foreground">
              Update for: <span className="font-medium">{marketName}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !message.trim()}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {editingUpdate ? 'Update' : 'Post'} Update
            </Button>
            
            {editingUpdate && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
