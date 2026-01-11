// Blank Template
// A completely empty document template for starting from scratch

import type { Template } from '@/lib/types/document.types';
import { generateTemplateId } from './utils';

export const BLANK_TEMPLATE: Template = {
  id: 'blank',
  name: 'Blank Document',
  description: 'Start with a completely empty document',
  category: 'general',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  content: {
    pages: [
      {
        id: generateTemplateId(),
        pageNumber: 1,
        headerType: 'default',
        footerType: 'default',
        components: [],
      },
    ],
    headerFooter: {
      defaultHeader: { height: 25, components: [] },
      defaultFooter: { height: 15, components: [] },
    },
    variables: {},
  },
};
