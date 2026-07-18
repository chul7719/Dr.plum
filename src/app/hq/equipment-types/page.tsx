// [디자인] 설비 종류 관리 페이지 래퍼 - max-w-5xl PC 폭, 실제 로직은 EquipmentTypeList
import { EquipmentTypeList } from "@/components/hq/EquipmentTypeList";

export default function EquipmentTypesPage() {
  return (
    <main className="min-h-screen max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <EquipmentTypeList />
    </main>
  );
}
