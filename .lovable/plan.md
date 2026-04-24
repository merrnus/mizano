
# Mutfak — Google Workspace Tarzı Hub

## 1. Veritabanı (tek migration)

**4 yeni tablo + RLS + updated_at trigger:**

```sql
-- mutfak_not (Keep tarzı)
create table public.mutfak_not (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  baslik text,
  icerik text not null default '',
  renk text not null default 'sari',  -- sari, pembe, mavi, yesil, mor, gri
  pinned boolean not null default false,
  etiketler text[] not null default '{}',
  arsiv boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- mutfak_belge (Docs - TipTap JSON)
create table public.mutfak_belge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  baslik text not null default 'Adsız belge',
  icerik jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- mutfak_tablo (Sheets - dinamik kolon/satır JSONB)
create table public.mutfak_tablo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  baslik text not null default 'Adsız tablo',
  kolonlar jsonb not null default '[]'::jsonb,  -- [{id, ad, tip}]
  satirlar jsonb not null default '[]'::jsonb,  -- [{id, hucreler:{kolonId:value}}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- mutfak_dosya (Drive metadata)
create table public.mutfak_dosya (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ad text not null,
  mime_type text,
  boyut bigint not null default 0,
  klasor text not null default '/',  -- "/", "/projeler", "/projeler/2024"
  storage_path text not null,
  created_at timestamptz not null default now()
);
```

- Her tabloda RLS (auth.uid() = user_id, mevcut pattern aynen).
- Her tabloda `set_updated_at` trigger (mevcut fonksiyon).
- Yeni storage bucket: `mutfak-dosya` (private, RLS ile).

## 2. Yönlendirme (Routing)

`src/routes/workspace.tsx` → layout route + `<Outlet />`. Alt route'lar:

| Route | İçerik |
|---|---|
| `/workspace` | Hub launcher (5 büyük tile, gradient, sayaçlar) |
| `/workspace/notlar` | Keep tarzı masonry grid |
| `/workspace/belge` | Belge listesi |
| `/workspace/belge/$id` | Tek belge editörü (TipTap) |
| `/workspace/tablo` | Tablo listesi |
| `/workspace/tablo/$id` | Tek tablo editörü |
| `/workspace/surucu` | Drive: klasör + dosya navigasyonu |
| `/workspace/pomodoro` | SVG ring'li gelişmiş timer |

Sol sidebar'a tek "Mutfak" linki + alt-tab bar mobilde gizli (zaten gizli).

## 3. Modül Detayları

### A) Notlar (Keep)
- Masonry grid (CSS columns), pastel kart renkleri (sari/pembe/mavi/yesil/mor/gri).
- Pin toggle, renk seçici, etiket chip'leri, arşiv butonu.
- Üstte "Hızlı not ekle" composer (Google Keep gibi tek satır → expand).
- Arama ve etiket filtresi.

### B) Belge (Docs)
- `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/extension-placeholder`.
- 800ms debounce autosave, üstte "Kaydedildi · 2 sn önce" indicator.
- Slash command yok (basit tutuyoruz), ama: H1/H2/H3, bold, italic, liste, kod, alıntı, link toolbar.
- Emoji picker'lı başlık.

### C) Tablo (Sheets)
- Dinamik kolon ekle/sil, kolon tipi: metin/sayı/tarih/checkbox.
- Hücre tıklayınca inline edit, Enter ile sıradaki satıra geç.
- "+ Satır" / "+ Kolon" butonları.
- Tüm değişiklikler 600ms debounce ile JSONB olarak kaydedilir.

### D) Sürücü (Drive)
- Klasör breadcrumb (örn: Mutfak / projeler / 2024).
- Drag-and-drop yükleme zone + klasik buton.
- Grid/list toggle, dosya türüne göre ikon (image/pdf/docx/zip).
- Sağ tık menüsü: indir, taşı, sil, yeniden adlandır.
- Yeni klasör oluştur (sadece path-based, fiziksel folder yok).

### E) Pomodoro
- SVG circular progress ring (animated stroke-dashoffset).
- Pre-set: 25/5, 50/10, 90/20.
- Browser notification + ses ipucu.
- Bugünkü tamamlanan pomodoro sayacı (localStorage).

## 4. Hub UI (`/workspace` ana sayfa)

- 3×2 grid: Notlar, Belge, Tablo, Sürücü, Pomodoro, (boş/coming soon).
- Her tile: gradient bg + icon + başlık + canlı sayaç ("12 not · 3 sabitli").
- Mesh gradient hover effect, 16:10 aspect.
- Üstte arama: "Mutfakta ara..." (tüm modüllerde fulltext arama, faz 2'de).

## 5. Hooks

`src/lib/mutfak-hooks.ts` — TanStack Query ile:
- `useNotlar()`, `useNotEkle()`, `useNotGuncelle()`, `useNotSil()`
- `useBelgeler()`, `useBelge(id)`, `useBelgeKaydet()`
- `useTablolar()`, `useTablo(id)`, `useTabloKaydet()`
- `useDosyalar(klasor)`, `useDosyaYukle()`, `useDosyaSil()`

`src/lib/mutfak-tipleri.ts` — TypeScript tipler.

## 6. Bağımlılıklar

Yeni paketler: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-link`.

## 7. Dosya Listesi

**Yeni:**
- `src/lib/mutfak-tipleri.ts`
- `src/lib/mutfak-hooks.ts`
- `src/components/mizan/mutfak/not-kart.tsx`
- `src/components/mizan/mutfak/not-composer.tsx`
- `src/components/mizan/mutfak/belge-editor.tsx`
- `src/components/mizan/mutfak/tablo-editor.tsx`
- `src/components/mizan/mutfak/dosya-grid.tsx`
- `src/components/mizan/mutfak/dosya-upload.tsx`
- `src/components/mizan/mutfak/pomodoro-ring.tsx`
- `src/components/mizan/mutfak/hub-tile.tsx`
- `src/routes/workspace.tsx` (refactor → layout)
- `src/routes/workspace.index.tsx` (hub)
- `src/routes/workspace.notlar.tsx`
- `src/routes/workspace.belge.tsx`
- `src/routes/workspace.belge.$id.tsx`
- `src/routes/workspace.tablo.tsx`
- `src/routes/workspace.tablo.$id.tsx`
- `src/routes/workspace.surucu.tsx`
- `src/routes/workspace.pomodoro.tsx`

**Sırasıyla yapım:** Migration → Tipler+Hooks → Hub+Layout → Notlar → Pomodoro → Belge (TipTap) → Tablo → Sürücü.

Tek loop'ta hepsini bitiriyorum. Onayla yazman yeterli.
