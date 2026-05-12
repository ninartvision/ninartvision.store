import {defineType, defineField, defineArrayMember} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const slider = defineType({
  name: 'slider',
  title: 'Slider',
  type: 'document',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Slider Title',
      type: 'string',
      description: 'Internal name for this slider',
      validation: (Rule) => Rule.required(),
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
      name: 'settings',
      title: 'Settings',
      type: 'object',
      fields: [
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
          name: 'loop',
          title: 'Loop',
          type: 'boolean',
          description: 'Return to first slide after last',
          initialValue: true,
        }),
        defineField({
          name: 'showDots',
          title: 'Show Navigation Dots',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'showArrows',
          title: 'Show Navigation Arrows',
          type: 'boolean',
          initialValue: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slideCount: 'slides',
    },
    prepare({title, slideCount}) {
      const count = Array.isArray(slideCount) ? slideCount.length : 0
      return {
        title,
        subtitle: `${count} slide${count !== 1 ? 's' : ''}`,
        media: PlayIcon,
      }
    },
  },
})
