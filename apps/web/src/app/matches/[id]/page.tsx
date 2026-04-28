import { redirect } from 'next/navigation';

export default function MatchDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/es/matches/${params.id}`);
}
