-- Os seis livros de formação viram uma única coletânea: Kit do Pregador.
-- O conteúdo (todas as línguas) é movido; nada é retraduzido.

INSERT INTO public.library_products (slug) VALUES ('kit-do-pregador')
ON CONFLICT (slug) DO NOTHING;

UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-1'
  WHERE product_slug = 'desenvolvimento-espiritual-do-pregador';
UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-2'
  WHERE product_slug = 'exegese-e-hermeneutica-biblica';
UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-3'
  WHERE product_slug = 'historia-da-pregacao-crista';
UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-4'
  WHERE product_slug = 'preparacao-de-sermoes';
UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-5'
  WHERE product_slug = 'pregacao-tematica';
UPDATE public.library_volumes SET product_slug = 'kit-do-pregador', volume_slug = 'volume-6'
  WHERE product_slug = 'pregacao-expositiva';

INSERT INTO public.library_entitlements (email, product_slug)
VALUES ('ferramentasdocristaoo@gmail.com', 'kit-do-pregador')
ON CONFLICT (email, product_slug) DO NOTHING;

-- Remove os produtos individuais (as liberações e SKUs antigos caem em cascata).
DELETE FROM public.library_products
WHERE slug IN (
  'desenvolvimento-espiritual-do-pregador',
  'exegese-e-hermeneutica-biblica',
  'historia-da-pregacao-crista',
  'preparacao-de-sermoes',
  'pregacao-tematica',
  'pregacao-expositiva'
);
