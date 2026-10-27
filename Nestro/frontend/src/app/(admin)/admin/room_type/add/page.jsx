import TaxonomyForm from "@/components/admin/TaxonomyForm";

export const metadata = { title: "Add room type — Nestro Admin" };

export default function AddRoomPage() {
  return <TaxonomyForm resource="room" listPath="/admin/room_type" heading="Room type" />;
}
