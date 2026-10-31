// Keyword URLs: /products/brass-diya-<uuid>, /category/laddu-gopal-dress.
// The UUID stays in product URLs so a renamed product never breaks old links.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const slugify = (s = '') =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');

export const productPath = (p) => {
  const slug = slugify(p.name);
  return `/products/${slug ? `${slug}-` : ''}${p.id}`;
};

// "/products/brass-diya-<uuid>" param -> "<uuid>" (plain uuid passes through)
export const productIdFromParam = (param = '') => param.match(UUID_RE)?.[0] || param;

export const categoryPath = (c) => `/category/${slugify(c.name)}`;
