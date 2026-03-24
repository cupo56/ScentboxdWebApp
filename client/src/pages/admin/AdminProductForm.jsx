import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminCreateProduct,
  adminUpdateProduct,
} from '../../services/api';
import { getProductById } from '../../services/api';

const emptySize = { ml: '', price: '', stock: '' };

const defaultForm = {
  name: '', brand: '', description: '', price: '',
  category: 'Damen', featured: false,
  images: [''],
  sizes: [{ ...emptySize }],
  notes: { top: '', heart: '', base: '' },
};

export default function AdminProductForm() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const isEdit       = Boolean(id);
  const [form, setForm]       = useState(defaultForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getProductById(id).then((r) => {
      const p = r.data;
      setForm({
        name:        p.name,
        brand:       p.brand,
        description: p.description,
        price:       p.price,
        category:    p.category,
        featured:    p.featured,
        images:      p.images?.length ? p.images : [''],
        sizes:       p.sizes?.length  ? p.sizes  : [{ ...emptySize }],
        notes: {
          top:   p.notes?.top?.join(', ')   ?? '',
          heart: p.notes?.heart?.join(', ') ?? '',
          base:  p.notes?.base?.join(', ')  ?? '',
        },
      });
      setLoading(false);
    });
  }, [id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setSize = (i, key, val) => {
    const sizes = [...form.sizes];
    sizes[i] = { ...sizes[i], [key]: val };
    set('sizes', sizes);
  };

  const addSize    = () => set('sizes', [...form.sizes, { ...emptySize }]);
  const removeSize = (i) => set('sizes', form.sizes.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      price:  Number(form.price),
      sizes:  form.sizes.map((s) => ({
        ml: Number(s.ml), price: Number(s.price), stock: Number(s.stock),
      })),
      notes: {
        top:   form.notes.top.split(',').map((s) => s.trim()).filter(Boolean),
        heart: form.notes.heart.split(',').map((s) => s.trim()).filter(Boolean),
        base:  form.notes.base.split(',').map((s) => s.trim()).filter(Boolean),
      },
      images: form.images.filter(Boolean),
    };

    try {
      if (isEdit) await adminUpdateProduct(id, payload);
      else        await adminCreateProduct(payload);
      navigate('/admin/products');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-400">Laden...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">
        {isEdit ? 'Produkt bearbeiten' : 'Neues Produkt'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basis-Felder */}
        {[
          { label: 'Name',   key: 'name',  type: 'text' },
          { label: 'Marke',  key: 'brand', type: 'text' },
          { label: 'Einstiegspreis (€)', key: 'price', type: 'number' },
          { label: 'Bild-URL', key: 'images[0]', type: 'text' },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">
              {label}
            </label>
            <input
              type={type}
              value={key === 'images[0]' ? form.images[0] : form[key]}
              onChange={(e) => {
                if (key === 'images[0]') set('images', [e.target.value]);
                else set(key, e.target.value);
              }}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
              required
            />
          </div>
        ))}

        {/* Beschreibung */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">
            Beschreibung
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* Kategorie */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">
            Kategorie
          </label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {['Damen', 'Herren', 'Unisex'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="featured" className="text-sm text-gray-700">
            Auf der Startseite hervorheben (Featured)
          </label>
        </div>

        {/* Größen */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
            Größen
          </label>
          <div className="space-y-2">
            {form.sizes.map((size, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="number" placeholder="ml"
                  value={size.ml}
                  onChange={(e) => setSize(i, 'ml', e.target.value)}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number" placeholder="Preis €"
                  value={size.price}
                  onChange={(e) => setSize(i, 'price', e.target.value)}
                  className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number" placeholder="Stock"
                  value={size.stock}
                  onChange={(e) => setSize(i, 'stock', e.target.value)}
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                {form.sizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSize(i)}
                    className="text-red-400 hover:text-red-600 text-xs px-2"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addSize}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
          >
            + Größe hinzufügen
          </button>
        </div>

        {/* Duftnoten */}
        {[
          { label: 'Duftnoten — Top (kommagetrennt)',  key: 'top' },
          { label: 'Duftnoten — Herz (kommagetrennt)', key: 'heart' },
          { label: 'Duftnoten — Basis (kommagetrennt)', key: 'base' },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1">
              {label}
            </label>
            <input
              type="text"
              value={form.notes[key]}
              onChange={(e) => set('notes', { ...form.notes, [key]: e.target.value })}
              placeholder="z.B. Bergamotte, Zitrone"
              className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        ))}

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gray-900 text-white text-sm rounded-lg
                       hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? 'Speichern...' : isEdit ? 'Änderungen speichern' : 'Produkt anlegen'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-200 text-gray-600 text-sm
                       rounded-lg hover:bg-gray-50"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
