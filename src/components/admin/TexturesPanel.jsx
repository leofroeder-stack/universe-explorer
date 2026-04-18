import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const TEXTURE_KEYS = ['moon', 'mars', 'mercury', 'venus', 'earth', 'jupiter', 'saturn', 'uranus', 'neptune', 'sun'];

export default function TexturesPanel() {
  const [textures, setTextures] = useState({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});

  // Load cached textures on mount
  useEffect(() => {
    base44.functions.invoke('textureManager', { action: 'getAll' })
      .then(res => {
        setTextures(res.data?.textures || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (key) => {
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      await base44.functions.invoke('textureManager', {
        action: 'download',
        textureKey: key,
      });
      // Refresh textures list
      const res = await base44.functions.invoke('textureManager', { action: 'getAll' });
      setTextures(res.data?.textures || {});
    } catch (error) {
      console.error(`Failed to download ${key}:`, error);
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
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

          return (
            <Card key={key} className={isCached ? 'border-green-500/30 bg-green-500/5' : ''}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {isCached ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-semibold capitalize text-foreground">{key}</p>
                    <p className="text-xs text-muted-foreground">
                      {isCached ? 'Cached locally' : 'Not downloaded'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownload(key)}
                  disabled={isDownloading || isCached}
                  size="sm"
                  variant={isCached ? 'outline' : 'default'}
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