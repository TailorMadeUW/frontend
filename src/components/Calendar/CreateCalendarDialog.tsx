import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '@radix-ui/react-label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import useCalendarStore from '../../stores/calendarServerStore'
import EmojiPicker from './EmojiPicker'
import { Palette, CalendarDays, Info, X } from 'lucide-react'

const calendarSchema = z.object({
  name: z.string().min(1, 'Calendar name is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  color: z.string().min(1, 'Color is required'),
  description: z.string().optional(),
})

type CalendarFormData = z.infer<typeof calendarSchema>

interface CreateCalendarDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateCalendarDialog: React.FC<CreateCalendarDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { addCalendar } = useCalendarStore()
  const [selectedEmoji, setSelectedEmoji] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CalendarFormData>({
    resolver: zodResolver(calendarSchema),
    defaultValues: {
      emoji: '',
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
    },
  })

  const watchedColor = watch('color')
  const watchedEmoji = watch('emoji')

  const onSubmit = (data: CalendarFormData) => {
    addCalendar({
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      backgroundColor: data.color + '20',
      dragBackgroundColor: data.color + '20',
      borderColor: data.color,
      description: data.description,
      isAvailable: true,
    })
    reset()
    onOpenChange(false)
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white p-0" hideCloseButton={true}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader className="px-6 py-4 pb-2 border-b">
            <DialogTitle className="text-2xl text-gray-700 font-medium flex items-center justify-between">
              <span>Create New Calendar</span>
              <Button variant="ghost" size="icon" onClick={handleClose} className="hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4 text-gray-500" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">
              Create a new calendar to organize your events.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CalendarDays className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Calendar Name</Label>
                  <Input
                    {...register('name')}
                    placeholder="Work, Personal, etc."
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-5 h-5 text-gray-400 mt-1 flex items-center justify-center">
                  {watchedEmoji || '😀'}
                </div>
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Calendar Emoji</Label>
                  <input
                    type="hidden"
                    {...register('emoji')}
                  />
                  <div className="mt-1">
                    <EmojiPicker
                      selectedEmoji={watchedEmoji}
                      onEmojiSelect={(emoji) => {
                        setSelectedEmoji(emoji)
                        setValue('emoji', emoji, { shouldValidate: true })
                      }}
                    />
                  </div>
                  {errors.emoji && (
                    <p className="text-red-500 text-xs mt-1">{errors.emoji.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Palette className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Calendar Color</Label>
                  <div className="mt-1 flex gap-3">
                    <div 
                      className="w-10 h-10 rounded-md border" 
                      style={{ backgroundColor: watchedColor }}
                    />
                    <Input
                      type="color"
                      {...register('color')}
                      className="h-10 w-full"
                    />
                  </div>
                  {errors.color && (
                    <p className="text-red-500 text-xs mt-1">{errors.color.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Info className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Description (Optional)</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Add a description for your calendar..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Calendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
