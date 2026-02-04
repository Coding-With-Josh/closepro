'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Heart, Users, DollarSign, PieChart, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty';
import { EmptyOffersIllustration } from '@/components/illustrations';

interface Offer {
  id: string;
  name: string;
  offerCategory: string;
  deliveryModel: string;
  priceRange: string;
  coreOfferPrice?: string;
  coreOutcome?: string;
  mechanismHighLevel?: string;
}

export default function NewRoleplayPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOffer, setCreatingOffer] = useState(false);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch('/api/offers');
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      b2c_health: 'B2C Health',
      b2c_relationships: 'B2C Relationships',
      b2c_wealth: 'B2C Wealth',
      mixed_wealth: 'Mixed Wealth',
      b2b_services: 'B2B Services',
    };
    return labels[category] || category;
  };

  const getDeliveryLabel = (model: string) => {
    const labels: Record<string, string> = {
      dfy: 'Done-For-You',
      dwy: 'Done-With-You',
      diy: 'Do-It-Yourself',
      hybrid: 'Hybrid',
    };
    return labels[model] || model;
  };

  const getCategoryIcon = (category: string): ReactNode => {
    const iconMap: Record<string, ReactNode> = {
      b2c_health: <Heart className="h-5 w-5 text-red-500" />,
      b2c_relationships: <Users className="h-5 w-5 text-pink-500" />,
      b2c_wealth: <DollarSign className="h-5 w-5 text-green-500" />,
      mixed_wealth: <PieChart className="h-5 w-5 text-blue-500" />,
      b2b_services: <Briefcase className="h-5 w-5 text-purple-500" />,
    };
    return iconMap[category] ?? <Briefcase className="h-5 w-5 text-muted-foreground" />;
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: Record<string, string> = {
      b2c_health: 'Health and wellness solutions',
      b2c_relationships: 'Relationship and personal development',
      b2c_wealth: 'Financial and wealth building',
      mixed_wealth: 'Mixed wealth solutions',
      b2b_services: 'Business services and solutions',
    };
    return descriptions[category] || '';
  };

  const handleOfferSelect = (offerId: string) => {
    router.push(`/dashboard/roleplay/new/prospect?offerId=${offerId}`);
  };

  const handleCreateOffer = () => {
    router.push('/dashboard/offers/new?returnTo=roleplay');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/roleplay">Roleplay</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New session</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Start New Roleplay</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Step 1: Select an offer to begin
        </p>
      </div>

      {offers.length === 0 ? (
        <Card className="p-8 sm:p-12">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="illustration" className="size-32">
                <EmptyOffersIllustration className="size-full max-w-[8rem] max-h-[8rem]" />
              </EmptyMedia>
              <EmptyTitle>No offers yet</EmptyTitle>
              <EmptyDescription>Create your first offer to start a roleplay session</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={handleCreateOffer}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Offer
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Offer Tile */}
          <Card
            className="p-6 border-2 border-dashed hover:border-primary cursor-pointer transition-all flex flex-col items-center justify-center min-h-[200px]"
            onClick={handleCreateOffer}
          >
            <Plus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Create New Offer</h3>
            <p className="text-sm text-muted-foreground text-center">
              Create a new offer to use in this roleplay
            </p>
          </Card>

          {/* Existing Offers */}
          {offers.map((offer) => {
            const description = (offer.coreOutcome ?? offer.mechanismHighLevel ?? getCategoryDescription(offer.offerCategory)).trim();
            const descriptionDisplay = description ? (description.length > 120 ? `${description.slice(0, 120)}…` : description) : null;
            return (
              <Card
                key={offer.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handleOfferSelect(offer.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 mt-0.5 rounded-lg bg-muted/50 p-2">
                    {getCategoryIcon(offer.offerCategory)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{offer.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{getCategoryLabel(offer.offerCategory)}</Badge>
                      <Badge variant="secondary">{getDeliveryLabel(offer.deliveryModel)}</Badge>
                    </div>
                    {descriptionDisplay && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {descriptionDisplay}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {offer.coreOfferPrice || offer.priceRange || 'Price not set'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleOfferSelect(offer.id);
                }}>
                  Select Offer
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
