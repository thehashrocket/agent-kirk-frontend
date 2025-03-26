/**
 * @file src/components/NotificationBell.tsx
 * A real-time notification system component that displays and manages user notifications.
 * Built as a Client Component using Next.js App Router and shadcn/ui components.
 */

'use client';

import { Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

/**
 * Interface representing a notification object.
 * @interface Notification
 * @property {string} id - Unique identifier for the notification
 * @property {string} title - Title of the notification
 * @property {string} content - Main content/message of the notification
 * @property {boolean} isRead - Whether the notification has been read
 * @property {string} [link] - Optional URL to navigate to when clicking the notification
 * @property {Date} createdAt - Timestamp when the notification was created
 * @property {'MESSAGE_RECEIVED' | 'REPORT_GENERATED'} type - Type of notification
 */
interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  type: 'MESSAGE_RECEIVED' | 'REPORT_GENERATED';
}

/**
 * NotificationBell component that provides real-time notification functionality.
 * 
 * Features:
 * - Real-time notification updates (polls every minute)
 * - Unread count badge
 * - Mark as read functionality
 * - Click-through to notification links
 * - Toast notifications for new items
 * - Scrollable notification list
 * 
 * @component
 * @example
 * ```tsx
 * <NotificationBell />
 * ```
 */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to update notification', {
        description: 'Please try again later',
      });
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
  }, [markAsRead, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data);
        const newUnreadCount = data.filter((n: Notification) => !n.isRead).length;
        
        // Show toasts for new notifications
        if (newUnreadCount > unreadCount) {
          const newNotifications = data.filter((n: Notification) => !n.isRead).slice(0, newUnreadCount - unreadCount);
          newNotifications.forEach((notification: Notification) => {
            toast(notification.title, {
              description: notification.content,
              action: {
                label: 'View',
                onClick: () => handleNotificationClick(notification),
              },
            });
          });
        }
        
        setUnreadCount(newUnreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        if (error instanceof Error && error.message.includes('Unauthorized')) {
          // Don't show error toast for auth errors, as user might just need to log in
          return;
        }
        toast.error('Failed to load notifications', {
          description: error instanceof Error ? error.message : 'Please try again later',
        });
      }
    };

    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [unreadCount, handleNotificationClick]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h5 className="font-medium">{notification.title}</h5>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{notification.content}</p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 