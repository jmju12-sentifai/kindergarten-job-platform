'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { PageSpinner, ButtonSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import type { Notification, NotificationType } from '@/types/database';

function getIconForType(type: NotificationType): 'mail' | 'check' | 'target' | 'megaphone' {
  switch (type) {
    case 'application_received': return 'mail';
    case 'status_changed': return 'check';
    case 'interview_request': return 'target';
    case 'result_notification': return 'megaphone';
    default: return 'mail';
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  return `${Math.floor(diffDay / 30)}개월 전`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 미인증은 proxy가 처리.
    if (authLoading || !user) return;

    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setLoading(false);
    }

    fetchNotifications();
  }, [user, authLoading, router, supabase]);

  const markAsRead = async (notif: Notification) => {
    if (!notif.read) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notif.id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    router.push(notif.link);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    setMarkingAll(true);
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
    toast('모든 알림을 읽었습니다');
  };

  if (authLoading || loading) {
    return <PageSpinner />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-muted hover:text-[#4EA85E] mb-3" type="button">
        <Icon name="arrow-left" size={14} />
        <span>뒤로</span>
      </button>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-foreground">알림</h1>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} disabled={markingAll} className="text-xs text-[#4EA85E] font-medium hover:underline disabled:opacity-50 flex items-center gap-1">
            {markingAll ? <ButtonSpinner /> : '모두 읽음'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-border rounded-lg p-10 text-center">
          <Icon name="mail" size={32} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => markAsRead(notif)}
              className={`w-full text-left bg-white border rounded-lg p-4 flex items-start gap-3 transition-colors hover:border-[#66c477] ${
                notif.read ? 'border-border' : 'border-[#66c477] bg-[#EAF5EC]/30'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                notif.read ? 'bg-background' : 'bg-[#EAF5EC]'
              }`}>
                <Icon name={getIconForType(notif.type)} size={16} className={notif.read ? 'text-muted' : 'text-[#4EA85E]'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs font-semibold ${notif.read ? 'text-foreground/70' : 'text-foreground'}`}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] text-muted flex-shrink-0">{timeAgo(notif.created_at)}</span>
                </div>
                <p className={`text-[11px] mt-0.5 ${notif.read ? 'text-muted' : 'text-foreground/70'}`}>
                  {notif.message}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#4EA85E] flex-shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
