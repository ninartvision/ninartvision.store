import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const sliderReference = defineType({
  name: 'sliderReference',
  title: 'Slider Reference',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Optional heading above the slider',
    }),
    defineField({
      name: 'slider',
      title: 'Select Slider',
      type: 'reference',
      to: [{type: 'slider'}],
      validation: (Rule) => Rule.required(),
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
      sliderTitle: 'slider.title',
      enabled: 'enabled',
    },
    prepare({title, sliderTitle, enabled}) {
      return {
        title: title || sliderTitle || 'Untitled Slider',
        subtitle: enabled
          ? `Referenced: ${sliderTitle || 'slider'}`
          : 'Slider Reference (Disabled)',
        media: PlayIcon,
      }
    },
  },
})
