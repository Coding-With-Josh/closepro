'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Offer {
  id: string;
  name: string;
  offerCategory: string;
}

interface ProspectAvatar {
  id: string;
  name: string;
  difficultyTier: string;
  sourceType: 'manual' | 'transcript_derived';
}


export default function NewRoleplayPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [avatars, setAvatars] = useState<ProspectAvatar[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('intermediate');

  useEffect(() => {
    fetchOffers();
    fetchAvatars();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      
      if (data.offers && data.offers.length > 0) {
        setOffers(data.offers);
        setSelectedOfferId(data.offers[0].id);
      } else {
        setOffers([
          { id: 'default', name: 'Default Practice Offer', offerCategory: 'b2c_wealth' },
        ]);
        setSelectedOfferId('default');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      setOffers([
        { id: 'default', name: 'Default Practice Offer', offerCategory: 'b2c_wealth' },
      ]);
      setSelectedOfferId('default');
    }
  };

  const fetchAvatars = async () => {
    try {
      const response = await fetch('/api/prospect-avatars');
      if (response.ok) {
        const data = await response.json();
        setAvatars(data.avatars || []);
      }
    } catch (error) {
      console.error('Error fetching avatars:', error);
    }
  };

  const handleStart = async () => {
    if (!selectedOfferId) {
      alert('Please select an offer');
      return;
    }

    setLoading(true);
    try {
      let sessionData: any = {
        offerId: selectedOfferId === 'default' ? 'default' : selectedOfferId,
        selectedDifficulty: difficulty,
        inputMode: 'voice', // Fixed to voice only
        mode: 'manual', // Fixed to manual/Ai Voice Roleplay
      };

      if (selectedAvatarId) {
        sessionData.prospectAvatarId = selectedAvatarId;
      }

      const response = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      router.push(`/dashboard/roleplay/${data.session.id}`);
    } catch (error: any) {
      console.error('Error starting roleplay:', error);
      alert('Failed to start roleplay: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Start New Roleplay</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Configure your roleplay session
        </p>
      </div>

      <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Offer Selection - First */}
        <div className="space-y-2">
          <Label>Offer</Label>
          <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
            <SelectTrigger>
              <SelectValue placeholder="Select an offer" />
            </SelectTrigger>
            <SelectContent>
              {offers.map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>
                  {offer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The offer you'll be selling in this roleplay
          </p>
          {offers.length === 0 || (offers.length === 1 && offers[0].id === 'default') ? (
            <p className="text-sm text-orange-500 mt-1">
              <Link href="/dashboard/offers/new" className="underline">
                Create an offer
              </Link> to use in roleplays
            </p>
          ) : null}
        </div>

        {/* Prospect Avatar Selection - Second (NEW) */}
        <div className="space-y-2">
          <Label>Pick the Prospect</Label>
          <Select value={selectedAvatarId} onValueChange={setSelectedAvatarId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a prospect avatar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Create New Prospect</SelectItem>
              {avatars.map((avatar) => (
                <SelectItem key={avatar.id} value={avatar.id}>
                  {avatar.name} ({avatar.difficultyTier})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Select from your saved prospect avatars, or create a new one
          </p>
          {avatars.length === 0 && (
            <p className="text-sm text-orange-500 mt-1">
              <Link href="/dashboard/prospect-avatars/new" className="underline">
                Create a prospect avatar
              </Link> to use in roleplays
            </p>
          )}
        </div>

        {/* Difficulty Selection - Third (only if manual prospect, not from previous lead/transcript) */}
        {(!selectedAvatarId || (selectedAvatarId && avatars.find(a => a.id === selectedAvatarId)?.sourceType === 'manual')) && (
          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Open and cooperative</SelectItem>
                <SelectItem value="intermediate">Realistic - Intermediate challenge</SelectItem>
                <SelectItem value="hard">Hard - Guarded and skeptical</SelectItem>
                <SelectItem value="expert">Elite - Expert level difficulty</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How difficult the prospect should be (only for manually created prospects, not from mp3 or transcript)
            </p>
          </div>
        )}

        {/* Roleplay Mode - Fourth (fixed to Ai Voice Roleplay) */}
        <div className="space-y-2">
          <Label>Roleplay Mode</Label>
          <Select value="manual" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Ai Voice Roleplay</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Practice with an AI prospect using voice interaction
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={loading}
            className="flex-1 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Roleplay'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
