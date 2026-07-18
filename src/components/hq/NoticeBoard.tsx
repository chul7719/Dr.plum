"use client";

// [기능] 본사 공지사항 게시판 관리 (README: "본사 공지사항 게시판") - 등록/수정/삭제(CRUD)
// 여기서 작성한 공지는 이 본사 소속 매장 담당자 + 협력업체 기사 앱에
// "본사 공지"로 그대로 노출됩니다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type Notice = { id: string; title: string; content: string; createdAt: string };

function fmtDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  async function load() {
    const res = await fetch("/api/notices");
    const json = await res.json();
    setNotices(json.notices ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "등록에 실패했습니다.");
    } else {
      setTitle("");
      setContent("");
    }
    await load();
    setBusy(false);
  }

  async function save(id: string) {
    if (!editTitle.trim() || !editContent.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/notices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editContent })
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "수정에 실패했습니다.");
    } else {
      setEditingId(null);
    }
    await load();
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    await load();
    setBusy(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">공지사항 관리</h1>
        <div className="flex items-center gap-2">
          <Link href="/hq" className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5">
            대시보드로
          </Link>
          <LogoutButton />
        </div>
      </div>

      {/* [디자인] 새 공지 작성 폼 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
        />
        <button
          disabled={busy || !title.trim() || !content.trim()}
          onClick={create}
          className="rounded-md bg-brand text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          공지 등록
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {notices === null && <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>}
      {notices?.length === 0 && <p className="text-sm text-gray-400 text-center py-10">등록된 공지가 없습니다.</p>}

      <div className="space-y-2">
        {notices?.map((n) => (
          <div key={n.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === n.id ? (
              <div className="space-y-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[80px]"
                />
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => save(n.id)} className="rounded-md bg-brand text-white px-3 py-2 text-xs font-medium">
                    저장
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-medium">
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{fmtDate(n.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{n.content}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingId(n.id);
                      setEditTitle(n.title);
                      setEditContent(n.content);
                    }}
                    className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1"
                  >
                    수정
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(n.id)}
                    className="text-xs font-medium border border-gray-300 rounded-md px-2 py-1 text-red-600 disabled:opacity-60"
                  >
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
