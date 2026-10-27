import { notFound } from "next/navigation";
import TaxonomyForm from "@/components/admin/TaxonomyForm";
import { fetchRoomById } from "@/utils/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit room type — Nestro Admin" };

export default async function EditRoomPage({ params }) {
  const { room_id } = await params;
  const { data: room, success } = await fetchRoomById(room_id);

  if (!success || !room?._id) notFound();

  return (
    <TaxonomyForm
      resource="room"
      listPath="/admin/room_type"
      heading="Room type"
      record={room}
    />
  );
}
