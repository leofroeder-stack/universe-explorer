import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TEXTURE_KEYS = ['moon', 'mars', 'mercury', 'venus', 'earth', 'jupiter', 'saturn', 'uranus', 'neptune', 'sun'];
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export default function TexturesPanel() {
  const [textures, setTextures] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [errors, setErrors] = useState({});

  // Load cached textures on mount
  useEffect(() => {
    base44.functions.invoke('textureManager', { action: 'getAll' })
      .then(res => {
        setTextures(res.data?.textures || {});
      })
      .catch(err => console.error('Failed to load textures:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (key) => {
    setDownloading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));

    let lastError;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await base44.functions.invoke('textureManager', {
          action: 'download',
          textureKey: key,
        });

        if (res.status === 200 && res.data?.success) {
          // Refresh textures list
          const allRes = await base44.functions.invoke('textureManager', { action: 'getAll' });
          setTextures(allRes.data?.textures || {});
          setDownloading(prev => ({ ...prev, [key]: false }));
          return;
        } else {
          throw new Error(res.data?.error || 'Unknown error');
        }
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // All retries exhausted
    setErrors(prev => ({ ...prev, [key]: lastError?.message || 'Download failed' }));
    setDownloading(prev => ({ ...prev, [key]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Textures</h2>
        <p className="text-sm text-muted-foreground">Download and cache planet textures locally for offline rendering.</p>
      </div>

      <div className="grid gap-3">
        {TEXTURE_KEYS.map(key => {
          const isCached = !!textures[key];
          const isDownloading = downloading[key];
          const error = errors[key];

          return (
            <Card key={key} className={error ? 'border-red-500/30 bg-red-500/5' : isCached ? 'border-green-500/30 bg-green-500/5' : ''}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 flex-1">
                  {error ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : isCached ? (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-foreground">{key}</p>
                    <p className="text-xs text-muted-foreground">
                      {error ? (
                        <span className="text-red-400">{error}</span>
                      ) : isCached ? (
                        'Cached locally'
                      ) : (
                        'Not downloaded'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {error && (
                    <Button
                      onClick={() => setErrors(prev => ({ ...prev, [key]: null }))}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      title="Dismiss error"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDownload(key)}
                    disabled={isDownloading || isCached}
                    size="sm"
                    variant={isCached ? 'outline' : error ? 'default' : 'default'}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Downloading…
                      </>
                    ) : isCached ? (
                      'Cached'
                    ) : (
                      <>
                        <Download className="w-3 h-3 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-300">
        <p className="font-semibold mb-1">About texture caching</p>
        <p>Once downloaded, textures are stored privately in your app and served locally. This eliminates third-party dependencies and improves performance.</p>
      </div>
    </div>
  );
}