'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Files, Clock, Trash2, MoreVertical } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Button,
  IconButton,
  Badge,
  LoadingState,
  EmptyState,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/ui/primitives';
import { ThemeSelector } from '@/components/ThemeSelector';
import type { DocumentResponse } from '@/lib/types/document.types';
import { fetchDocuments, deleteDocument } from '@/lib/api';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

interface DocumentCardProps {
  document: DocumentResponse;
  onDelete: (id: string) => void;
}

function DocumentCard({ document, onDelete }: DocumentCardProps) {
  return (
    <Card variant="interactive" padding="none" className="group overflow-hidden">
      <Link href={`/builder/${document.id}`} className="block">
        {/* Document Preview */}
        <div className="relative h-32 bg-linear-to-br from-surface-container to-surface-container-high flex items-center justify-center overflow-hidden">
          <div className="absolute inset-3 bg-surface rounded-lg border border-outline-variant/20 shadow-sm">
            <div className="h-4 bg-primary/5 border-b border-outline-variant/10" />
            <div className="p-2 space-y-1">
              <div className="h-1.5 w-3/4 bg-on-surface/10 rounded" />
              <div className="h-1.5 w-1/2 bg-on-surface/5 rounded" />
              <div className="h-1.5 w-2/3 bg-on-surface/5 rounded" />
            </div>
          </div>
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/90 backdrop-blur-sm text-primary">
            <FileText className="h-3.5 w-3.5" />
          </div>
        </div>

        <CardContent className="p-4">
          <CardTitle className="text-sm font-semibold text-on-surface truncate">{document.title || 'Untitled Document'}</CardTitle>
          <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
            <Clock className="h-3 w-3" />
            <span>{formatDate(document.updatedAt)}</span>
          </div>
        </CardContent>
      </Link>

      {/* Actions Menu */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Menu
          trigger={
            <IconButton
              variant="ghost"
              size="sm"
              icon={<MoreVertical className="h-4 w-4" />}
              aria-label="Document options"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          }
        >
          <MenuItem
            icon={<Trash2 className="h-4 w-4" />}
            destructive
            onClick={() => {
              onDelete(document.id);
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      </div>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load documents on mount
  useEffect(() => {
    async function loadDocuments() {
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, []);

  async function handleDelete() {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete);
      setDocuments((prev) => prev.filter((d) => d.id !== documentToDelete));
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  }

  function openDeleteDialog(id: string) {
    setDocumentToDelete(id);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-on-surface">PDF Builder</h1>
                <p className="text-sm text-on-surface-variant">Create professional documents</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeSelector />
              <div className="h-6 w-px bg-outline-variant/30" />
              <Link href="/templates">
                <Button variant="outline" size="default">
                  <Files className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="filled" size="default">
                  <Plus className="h-4 w-4 mr-2" />
                  New Document
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-on-surface mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/templates">
              <Card variant="highlighted" padding="default" className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Create New Document</CardTitle>
                    <CardDescription className="text-sm">Start from scratch or use a template</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/templates">
              <Card variant="elevated" padding="default" className="cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-secondary-container">
                    <Files className="h-6 w-6 text-on-secondary-container" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Browse Templates</CardTitle>
                    <CardDescription className="text-sm">Insurance, legal, business & more</CardDescription>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Recent Documents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface">Recent Documents</h2>
            {documents.length > 0 && (
              <Badge variant="secondary" size="sm">
                {documents.length} document{documents.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {isLoading ? (
            <LoadingState isLoading={true} fallbackText="Loading documents...">
              <></>
            </LoadingState>
          ) : documents.length === 0 ? (
            <Card variant="outlined" padding="lg">
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No documents yet"
                description="Create your first document to get started"
                action={{
                  label: 'Create Document',
                  onClick: () => router.push('/templates'),
                  variant: 'filled',
                }}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={openDeleteDialog} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>Are you sure you want to delete this document? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
