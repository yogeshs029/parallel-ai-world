import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
  Globe,
  Trash2,
  Clock,
  Inbox,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/layout/LoadingState';
import { notificationService } from '../services/notificationService';
import { Notification, NotificationType } from '../types/runtime';
import { formatDateRelative, cn } from '../lib/utils';

const TYPE_ICONS: Record<NotificationType, { icon: React.FC<{ className?: string }>; color: string }> = {
  task_completed: { icon: CheckCircle2, color: 'text-brand-emerald' },
  person_message: { icon: MessageSquare, color: 'text-brand-purple-light' },
  approval_required: { icon: ShieldAlert, color: 'text-brand-amber' },
  world_update: { icon: Globe, color: 'text-brand-cyan' },
  system: { icon: Bell, color: 'text-text-muted' },
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const handleNewNotif = () => {
      loadNotifications();
    };

    window.addEventListener('parallel:notification', handleNewNotif);
    window.addEventListener('parallel:task_completed', handleNewNotif);
    return () => {
      window.removeEventListener('parallel:notification', handleNewNotif);
      window.removeEventListener('parallel:task_completed', handleNewNotif);
    };
  }, [loadNotifications]);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await notificationService.markRead(id);
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => ({ ...n, read: true }))
    );
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await notificationService.deleteNotification(id);
    setNotifications((prev: Notification[]) =>
      prev.filter((n: Notification) => n.id !== id)
    );
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const displayedList = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n: Notification) => !n.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  if (isLoading) {
    return <LoadingState message="Loading notification inbox..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/worlds" className="hover:text-text-primary transition-colors font-medium">
          My Worlds
        </Link>
        <span>/</span>
        <span className="text-text-primary font-bold">Notifications</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary font-sans">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <Badge variant="thinking" size="sm">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-secondary">
            Live updates, background task completions, and person messages from all your worlds.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={CheckCheck}
            onClick={handleMarkAllRead}
            className="shrink-0 self-start sm:self-auto"
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-background-surface p-1 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('unread')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'unread'
              ? 'bg-brand-purple text-white shadow-xs'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          <span>Unread</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {unreadCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'all'
              ? 'bg-brand-purple text-white shadow-xs'
              : 'text-text-muted hover:text-text-primary',
          )}
        >
          <span>All</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-background-elevated">
            {notifications.length}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      {displayedList.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={activeTab === 'unread' ? "You're all caught up!" : 'No notifications yet'}
          description={
            activeTab === 'unread'
              ? 'No unread notifications right now. Background task completions and messages will appear here.'
              : 'Notifications from your worlds and people will appear here as they work.'
          }
        />
      ) : (
        <div className="space-y-3">
          {displayedList.map((notif: Notification) => {
            const typeConfig = TYPE_ICONS[notif.type] || TYPE_ICONS.system;
            const Icon = typeConfig.icon;

            return (
              <Card
                key={notif.id}
                onClick={() => {
                  if (notif.actionUrl) {
                    if (!notif.read) {
                      notificationService.markRead(notif.id);
                    }
                    navigate(notif.actionUrl);
                  }
                }}
                className={cn(
                  'p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-brand-purple/40',
                  !notif.read
                    ? 'bg-background-elevated/90 border-brand-purple/30 shadow-xs'
                    : 'bg-background-surface opacity-80 hover:opacity-100',
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={cn(
                      'p-2.5 rounded-2xl bg-background-surface border border-border flex items-center justify-center shrink-0 mt-0.5',
                      typeConfig.color,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-purple-light shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[11px] text-text-dim flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateRelative(notif.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkRead(notif.id, e)}
                    >
                      Mark read
                    </Button>
                  )}

                  <button
                    onClick={(e) => handleDelete(notif.id, e)}
                    className="p-1.5 rounded-lg text-text-dim hover:text-brand-rose hover:bg-brand-rose/10 transition-colors cursor-pointer"
                    title="Remove notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
