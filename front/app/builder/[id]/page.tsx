'use client';

import { use } from 'react';
import { BuilderView } from '@/views';

interface BuilderPageProps {
  params: Promise<{ id: string }>;
}

export default function BuilderPage({ params }: BuilderPageProps) {
  const { id } = use(params);

  return <BuilderView documentId={id} />;
}
