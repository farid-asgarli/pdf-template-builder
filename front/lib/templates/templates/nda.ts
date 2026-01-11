// Non-Disclosure Agreement Template
// Standard mutual NDA for business confidentiality

import type { Template } from '@/lib/types/document.types';
import {
  createTextLabelProperties,
  createTextFieldProperties,
  createParagraphProperties,
  createSignatureBoxProperties,
  createDividerProperties,
} from '../defaults';

export const NDA_BASIC: Template = {
  id: 'nda-basic',
  name: 'Non-Disclosure Agreement',
  description: 'Standard mutual NDA for business confidentiality',
  category: 'legal',
  isBuiltIn: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  content: {
    pages: [
      {
        id: 'nda-page-1',
        pageNumber: 1,
        headerType: 'none',
        footerType: 'default',
        components: [
          {
            id: 'nda-title',
            type: 'text-label',
            position: { x: 20, y: 20 },
            size: { width: 170, height: 12 },
            properties: createTextLabelProperties({
              content: 'MUTUAL NON-DISCLOSURE AGREEMENT',
              fontSize: 20,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
            }),
          },
          {
            id: 'nda-divider',
            type: 'divider',
            position: { x: 60, y: 36 },
            size: { width: 90, height: 1 },
            properties: createDividerProperties({
              orientation: 'horizontal',
              thickness: 2,
              color: '#374151',
            }),
          },
          {
            id: 'nda-intro',
            type: 'paragraph',
            position: { x: 20, y: 48 },
            size: { width: 170, height: 35 },
            properties: createParagraphProperties({
              content:
                'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date last signed below (the "Effective Date") by and between the undersigned parties ("Party" or "Parties") for the purpose of preventing the unauthorized disclosure of Confidential Information.',
              fontSize: 11,
              fontFamily: 'Inter',
              lineHeight: 1.5,
              textAlign: 'justify',
            }),
          },
          {
            id: 'party1-label',
            type: 'text-label',
            position: { x: 20, y: 90 },
            size: { width: 40, height: 6 },
            properties: createTextLabelProperties({
              content: 'First Party:',
              fontSize: 11,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#374151',
              textAlign: 'left',
            }),
          },
          {
            id: 'party1-field',
            type: 'text-field',
            position: { x: 65, y: 88 },
            size: { width: 125, height: 10 },
            properties: createTextFieldProperties({
              label: '',
              fieldName: 'party1_name',
              placeholder: 'Company/Individual Name',
              required: true,
              fontSize: 11,
              fontFamily: 'Inter',
            }),
          },
          {
            id: 'party2-label',
            type: 'text-label',
            position: { x: 20, y: 106 },
            size: { width: 40, height: 6 },
            properties: createTextLabelProperties({
              content: 'Second Party:',
              fontSize: 11,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#374151',
              textAlign: 'left',
            }),
          },
          {
            id: 'party2-field',
            type: 'text-field',
            position: { x: 65, y: 104 },
            size: { width: 125, height: 10 },
            properties: createTextFieldProperties({
              label: '',
              fieldName: 'party2_name',
              placeholder: 'Company/Individual Name',
              required: true,
              fontSize: 11,
              fontFamily: 'Inter',
            }),
          },
          {
            id: 'nda-section1-title',
            type: 'text-label',
            position: { x: 20, y: 125 },
            size: { width: 170, height: 8 },
            properties: createTextLabelProperties({
              content: '1. Definition of Confidential Information',
              fontSize: 12,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'left',
            }),
          },
          {
            id: 'nda-section1-content',
            type: 'paragraph',
            position: { x: 20, y: 136 },
            size: { width: 170, height: 40 },
            properties: createParagraphProperties({
              content:
                '"Confidential Information" means any data or information that is proprietary to the Disclosing Party and not generally known to the public, including but not limited to: trade secrets, business plans, customer lists, financial information, product designs, technical data, and any other information that has commercial value.',
              fontSize: 10,
              fontFamily: 'Inter',
              lineHeight: 1.5,
              textAlign: 'justify',
            }),
          },
          {
            id: 'nda-section2-title',
            type: 'text-label',
            position: { x: 20, y: 182 },
            size: { width: 170, height: 8 },
            properties: createTextLabelProperties({
              content: '2. Obligations of Receiving Party',
              fontSize: 12,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'left',
            }),
          },
          {
            id: 'nda-section2-content',
            type: 'paragraph',
            position: { x: 20, y: 193 },
            size: { width: 170, height: 50 },
            properties: createParagraphProperties({
              content:
                'The Receiving Party shall hold and maintain the Confidential Information in strict confidence and shall not, without the prior written approval of the Disclosing Party: (a) disclose to any third parties the Confidential Information; (b) make or permit to be made any copies of the Confidential Information; or (c) make any commercial use whatsoever of the Confidential Information.',
              fontSize: 10,
              fontFamily: 'Inter',
              lineHeight: 1.5,
              textAlign: 'justify',
            }),
          },
        ],
      },
      {
        id: 'nda-page-2',
        pageNumber: 2,
        headerType: 'default',
        footerType: 'default',
        components: [
          {
            id: 'nda-section3-title',
            type: 'text-label',
            position: { x: 20, y: 10 },
            size: { width: 170, height: 8 },
            properties: createTextLabelProperties({
              content: '3. Term',
              fontSize: 12,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'left',
            }),
          },
          {
            id: 'nda-section3-content',
            type: 'paragraph',
            position: { x: 20, y: 21 },
            size: { width: 170, height: 25 },
            properties: createParagraphProperties({
              content:
                'This Agreement shall remain in effect for a period of two (2) years from the Effective Date, unless terminated earlier by either party upon thirty (30) days written notice.',
              fontSize: 10,
              fontFamily: 'Inter',
              lineHeight: 1.5,
              textAlign: 'justify',
            }),
          },
          {
            id: 'nda-signatures-title',
            type: 'text-label',
            position: { x: 20, y: 60 },
            size: { width: 170, height: 8 },
            properties: createTextLabelProperties({
              content: 'IN WITNESS WHEREOF',
              fontSize: 12,
              fontFamily: 'Inter',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
            }),
          },
          {
            id: 'nda-sig-intro',
            type: 'paragraph',
            position: { x: 20, y: 72 },
            size: { width: 170, height: 15 },
            properties: createParagraphProperties({
              content: 'The parties have executed this Agreement as of the Effective Date.',
              fontSize: 10,
              fontFamily: 'Inter',
              lineHeight: 1.5,
              textAlign: 'center',
            }),
          },
          {
            id: 'nda-sig-party1',
            type: 'signature-box',
            position: { x: 20, y: 95 },
            size: { width: 80, height: 35 },
            properties: createSignatureBoxProperties({
              signerName: 'First Party',
              signerTitle: 'Authorized Representative',
              dateRequired: true,
              showLine: true,
            }),
          },
          {
            id: 'nda-sig-party2',
            type: 'signature-box',
            position: { x: 110, y: 95 },
            size: { width: 80, height: 35 },
            properties: createSignatureBoxProperties({
              signerName: 'Second Party',
              signerTitle: 'Authorized Representative',
              dateRequired: true,
              showLine: true,
            }),
          },
        ],
      },
    ],
    headerFooter: {
      defaultHeader: {
        height: 15,
        components: [
          {
            id: 'nda-header-title',
            type: 'text-label',
            position: { x: 10, y: 3 },
            size: { width: 100, height: 8 },
            properties: createTextLabelProperties({
              content: 'Mutual Non-Disclosure Agreement',
              fontSize: 9,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              color: '#9ca3af',
              textAlign: 'left',
            }),
          },
        ],
      },
      defaultFooter: {
        height: 12,
        components: [
          {
            id: 'nda-footer-page',
            type: 'text-label',
            position: { x: 85, y: 2 },
            size: { width: 40, height: 8 },
            properties: createTextLabelProperties({
              content: 'Page {{pageNumber}} of {{totalPages}}',
              fontSize: 9,
              fontFamily: 'Inter',
              fontWeight: 'normal',
              color: '#9ca3af',
              textAlign: 'center',
            }),
          },
        ],
      },
    },
    variables: {
      party1Name: '',
      party2Name: '',
      effectiveDate: '',
    },
  },
};
