'use client';

import { useParams } from 'next/navigation';
import { BuilderView } from '@/views/builder';

export default function BuilderPage() {
  const params = useParams();
  const documentId = params.id as string;

  return <BuilderView documentId={documentId} />;
}
