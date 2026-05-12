import {defineType, defineField, defineArrayMember} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const sliderSection = defineType({
  name: 'sliderSection',
  title: 'Image Slider',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'slide',
        }),
      ],
      validation: (Rule) => Rule.min(1).error('Add at least one slide'),
    }),
    defineField({
      name: 'autoplay',
      title: 'Autoplay',
      type: 'boolean',
      description: 'Automatically advance slides',
      initialValue: false,
    }),
    defineField({
      name: 'interval',
      title: 'Autoplay Interval (seconds)',
      type: 'number',
      validation: (Rule) => Rule.min(2).max(30),
      initialValue: 5,
      hidden: ({parent}) => !parent?.autoplay,
    }),
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      description: 'Toggle to show/hide this section',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slideCount: 'slides',
      enabled: 'enabled',
    },
    prepare({title, slideCount, enabled}) {
      const count = Array.isArray(slideCount) ? slideCount.length : 0
      return {
        title: title || 'Untitled Slider',
        subtitle: enabled ? `${count} slide${count !== 1 ? 's' : ''}` : 'Slider (Disabled)',
        media: PlayIcon,
      }
    },
  },
})
