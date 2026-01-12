'use client';

import { useCallback } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { Button } from '@/app/ui/primitives';
import { useDocumentStore } from '@/lib/store/documentStore';

interface QuickActionsProps {
  componentId: string;
}

export function QuickActions({ componentId }: QuickActionsProps) {
  const { deleteComponent, duplicateComponent } = useDocumentStore();

  const handleDuplicate = useCallback(() => {
    duplicateComponent(componentId);
  }, [componentId, duplicateComponent]);

  const handleDelete = useCallback(() => {
    deleteComponent(componentId);
  }, [componentId, deleteComponent]);

  return (
    <div className='flex items-center gap-2 pt-3'>
      <Button variant='tonal' size='sm' className='flex-1 gap-2' onClick={handleDuplicate}>
        <Copy className='h-4 w-4' />
        Duplicate
      </Button>
      <Button variant='destructive-outline' size='sm' className='gap-2' onClick={handleDelete}>
        <Trash2 className='h-4 w-4' />
        Delete
      </Button>
    </div>
  );
}
