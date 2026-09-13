import { notFound } from 'next/navigation';
import GenerateForm from '@/components/GenerateForm';
import { sbPublic, getProduct } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function GeneratePage({ params }) {
  let product = null;
  try { product = await getProduct(sbPublic(), params.slug); } catch {}
  if (!product) notFound();
  return <GenerateForm product={product} />;
}
