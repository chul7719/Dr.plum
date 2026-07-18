"use client";

// [기능] 회원가입 폼 - 계정 생성(POST /api/auth/signup) 후 바로 로그인까지
// 이어서 처리합니다. 역할을 고르면 그 역할에 필요한 소속 입력 필드가
// 아래에 나타납니다 ([디자인] 역할 3종 토글 버튼 + 조건부 필드).
import { useEffect, useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Role = "MART_MANAGER" | "TECHNICIAN" | "HQ_ADMIN";

type Options = {
  organizations: { id: string; name: string; stores: { id: string; name: string }[] }[];
  vendors: { id: string; name: string }[];
};

const ROLE_LABEL: Record<Role, string> = {
  MART_MANAGER: "매장 담당자",
  TECHNICIAN: "협력업체 기사",
  HQ_ADMIN: "본사 관리자"
};

export function SignupForm() {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<Role>("MART_MANAGER");

  // 매장 담당자 전용
  const [organizationId, setOrganizationId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [newStoreName, setNewStoreName] = useState("");

  // 협력업체 기사 전용
  const [vendorId, setVendorId] = useState("");
  const [newVendorName, setNewVendorName] = useState("");

  // 본사 관리자 전용
  const [newOrganizationName, setNewOrganizationName] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/signup-options")
      .then((res) => res.json())
      .then(setOptions);
  }, []);

  const selectedOrg = options?.organizations.find((o) => o.id === organizationId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (role === "MART_MANAGER" && !storeId && (!organizationId || !newStoreName)) {
      setError("소속 본사를 고르고 지점을 선택하거나 새로 입력해주세요.");
      return;
    }
    if (role === "TECHNICIAN" && !vendorId && !newVendorName) {
      setError("소속 업체를 선택하거나 새로 입력해주세요.");
      return;
    }
    if (role === "HQ_ADMIN" && !newOrganizationName) {
      setError("새로 만들 본사(프랜차이즈) 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        organizationId: organizationId || undefined,
        storeId: storeId || undefined,
        newStoreName: newStoreName || undefined,
        vendorId: vendorId || undefined,
        newVendorName: newVendorName || undefined,
        newOrganizationName: newOrganizationName || undefined
      })
    });

    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      setError(data.error ?? "가입에 실패했습니다.");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setError("가입은 완료됐지만 자동 로그인에 실패했습니다. 로그인 화면에서 다시 시도해주세요.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-5">
      <label className="block text-sm text-gray-600">
        이름
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="홍길동"
        />
      </label>
      <label className="block text-sm text-gray-600">
        이메일
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </label>
      <div className="flex gap-2">
        <label className="block text-sm text-gray-600 w-1/2">
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="8자 이상"
          />
        </label>
        <label className="block text-sm text-gray-600 w-1/2">
          비밀번호 확인
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      {/* [디자인] 역할 선택 토글 3종 */}
      <div>
        <p className="text-sm text-gray-600 mb-2">역할</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-md border py-2 text-sm font-medium ${
                role === r ? "border-brand bg-brand-light text-brand" : "border-gray-300 text-gray-600"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* [기능] 역할별 소속 입력 - 각 역할이 반드시 소속(지점/업체/본사)을 갖도록 함 */}
      {role === "MART_MANAGER" && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-sm text-gray-600">
            소속 본사
            <select
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                setStoreId("");
              }}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">선택하세요</option>
              {options?.organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>

          {organizationId && (
            <label className="block text-sm text-gray-600">
              지점
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">새 지점 만들기</option>
                {selectedOrg?.stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {organizationId && !storeId && (
            <label className="block text-sm text-gray-600">
              새 지점 이름
              <input
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="예: 강남점"
              />
            </label>
          )}
        </div>
      )}

      {role === "TECHNICIAN" && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-sm text-gray-600">
            소속 업체
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">새 업체 등록</option>
              {options?.vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>

          {!vendorId && (
            <label className="block text-sm text-gray-600">
              새 업체 이름
              <input
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="예: 한성설비"
              />
            </label>
          )}
        </div>
      )}

      {role === "HQ_ADMIN" && (
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-sm text-gray-600">
            새로 만들 본사(프랜차이즈) 이름
            <input
              value={newOrganizationName}
              onChange={(e) => setNewOrganizationName(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="예: 그린마트 본사"
            />
          </label>
          <p className="text-xs text-gray-400">
            본사 관리자는 항상 새 프랜차이즈를 만들며 시작합니다. 기존 본사에 관리자로
            합류하려면 그 본사의 다른 관리자에게 직접 계정을 만들어달라고 요청해주세요.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand text-white py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "가입 중..." : "가입하고 시작하기"}
      </button>
    </form>
  );
}
