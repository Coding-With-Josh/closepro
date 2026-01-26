'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileAudio, Loader2, CheckCircle2, AlertCircle, X, Search, Filter, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CallAnalysisReviewPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<Array<{
    id: string;
    fileName: string;
    status: string;
    duration?: number;
    createdAt: string;
  }>>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await fetch('/api/calls');
        if (response.ok) {
          const data = await response.json();
          setCalls(data.calls || []);
        }
      } catch (err) {
        console.error('Error fetching calls:', err);
      } finally {
        setLoadingCalls(false);
      }
    };
    fetchCalls();
  }, []);

  // Filter calls based on search and status
  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold tracking-tight">
          Call Analysis
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Review your sales calls. This view does not update performance metrics.
        </p>
      </div>

      {/* Call History */}
      <Card className="border border-white/10 bg-linear-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div>
            <CardTitle className="font-serif">Call History</CardTitle>
            <CardDescription>
              Review your sales calls and their analysis
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {calls.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search calls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="analyzing">Analyzing</SelectItem>
                  <SelectItem value="transcribing">Transcribing</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {loadingCalls ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12">
              <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No calls uploaded yet</p>
              <p className="text-sm text-muted-foreground/70">
                Upload calls in <Link href="/dashboard/calls" className="underline">Live Call Reporting</Link> to review them here
              </p>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No calls match your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                    call.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                    call.status === 'processing' || call.status === 'transcribing' || call.status === 'analyzing' ? 'bg-primary/20 text-primary' :
                      call.status === 'failed' ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'
                  }`}>
                    {call.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : call.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{call.fileName}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{call.status}</span>
                      {call.duration && (
                        <>
                          <span>•</span>
                          <span>{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(call.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
