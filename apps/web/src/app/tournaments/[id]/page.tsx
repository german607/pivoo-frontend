import { redirect } from 'next/navigation';

export default function TournamentDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/es/tournaments/${params.id}`);
}
