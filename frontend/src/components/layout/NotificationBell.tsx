"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  id: number;
  title: string;
  content: string;
  message_type: string;
  is_read: boolean;
  related_course_id: number | null;
  created_at: string;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 初始化获取未读数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch(`${API_URL}/api/v1/messages/unread-count`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unread_count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };

    fetchUnreadCount();
    // 可选：设置定时器轮询未读数
    const timer = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(timer);
  }, []);

  // 打开 Popover 时获取消息列表
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/api/v1/messages/?unread_only=true`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        toast.error("无法加载消息");
      } finally {
        setLoading(false);
      }
    }
  };

  // 标记消息为已读
  const handleMarkAsRead = async (messageId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_URL}/api/v1/messages/${messageId}/read`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        // 更新消息状态为已读，而不是移除
        setMessages((prev) => prev.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ));
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // 触发全局事件通知其他组件更新未读数
        window.dispatchEvent(new CustomEvent('notification-read'));
      }
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  // 鼠标悬浮标记已读（防抖）
  const handleMouseEnter = (msg: Message) => {
    if (!msg.is_read) {
      handleMarkAsRead(msg.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <div className="font-semibold text-sm">通知</div>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} 未读
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground text-xs">
              加载中...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground space-y-2">
              <MailOpen className="h-8 w-8 opacity-20" />
              <span className="text-xs">暂无未读消息</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "relative flex flex-col gap-1 p-4 text-sm transition-colors border-b last:border-0 cursor-pointer",
                    msg.is_read
                      ? "bg-muted/20 opacity-70"
                      : "hover:bg-muted/50"
                  )}
                  onMouseEnter={() => handleMouseEnter(msg)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={cn(
                      "leading-none",
                      msg.is_read ? "font-normal text-muted-foreground" : "font-medium"
                    )}>
                      {msg.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!msg.is_read && (
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {msg.content}
                  </p>

                  {msg.related_course_id && (
                    <div className="mt-2">
                      <Link
                        href={`/learn/course/${msg.related_course_id}`}
                        className="text-xs text-primary hover:underline font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        查看详情
                      </Link>
                    </div>
                  )}

                  {/* 未读指示器 */}
                  {!msg.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
