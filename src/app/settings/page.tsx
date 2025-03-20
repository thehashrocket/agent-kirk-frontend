'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';

interface UserSettings {
  emailNotifications: boolean;
  messageNotifications: boolean;
  reportNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    messageNotifications: true,
    reportNotifications: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      const data = await response.json();
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings', {
        description: 'Please try again later.',
      });
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof UserSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: newSettings[key] }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      setSettings(newSettings);
      toast.success('Settings updated', {
        description: 'Your notification preferences have been saved.',
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings', {
        description: 'Please try again later.',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how you receive notifications from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive notifications about new messages and reports via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => updateSetting('emailNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="message-notifications">Message Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive notifications when you get new messages
              </p>
            </div>
            <Switch
              id="message-notifications"
              checked={settings.messageNotifications}
              onCheckedChange={() => updateSetting('messageNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="report-notifications">Report Notifications</Label>
              <p className="text-sm text-gray-500">
                Receive notifications when new reports are generated
              </p>
            </div>
            <Switch
              id="report-notifications"
              checked={settings.reportNotifications}
              onCheckedChange={() => updateSetting('reportNotifications')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 