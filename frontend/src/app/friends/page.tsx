'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import ClientGuard from '@/components/ClientGuard';
import { UserGroupIcon } from '@heroicons/react/24/outline';

export default function FriendsPage() {
  return (
    <ClientGuard>
      <Sidebar>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserGroupIcon className="h-8 w-8 text-primary" />
              Friends
            </h1>
            <p className="text-muted-foreground">
              Connect with friends and compete on the leaderboard
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
              <CardDescription>
                The friends feature is under development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Soon you&apos;ll be able to add friends, send challenges, and compete on leaderboards!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    </ClientGuard>
  );
}
