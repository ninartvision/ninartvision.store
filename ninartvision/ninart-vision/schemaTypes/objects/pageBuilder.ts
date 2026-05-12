import {defineType, defineField, defineArrayMember} from 'sanity'
import {DocumentsIcon} from '@sanity/icons'

export const pageBuilder = defineType({
  name: 'pageBuilder',
  title: 'Page Builder',
  type: 'array',
  of: [
    defineArrayMember({type: 'heroSection'}),
    defineArrayMember({type: 'gallerySection'}),
    defineArrayMember({type: 'artistSection'}),
    defineArrayMember({type: 'articleSection'}),
    defineArrayMember({type: 'textSection'}),
    defineArrayMember({type: 'sliderSection'}),
    defineArrayMember({type: 'sliderReference'}),
  ],
})
