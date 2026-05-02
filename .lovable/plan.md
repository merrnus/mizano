# Takvim için düzeltme planı

Takvimi gerçekten Google Calendar hissine yaklaştırmak için bunu küçük yamalarla değil, yerleşim ve sürükle motorunu birlikte toparlayarak düzelteceğim.

## Ne düzelecek

1. Takvim artık dar bir kutuya sıkışmayacak; mevcut alanı tam kullanacak.
2. Günlük/haftalık görünüm 24 saat eksenini daha doğru ve erişilebilir gösterecek.
3. Akşam saatleri görünür olacak; alt saatler panel tarafından kesilmeyecek.
4. Sürükle-bırak sırasında sayfanın kendi kendine yukarı kayması engellenecek.
5. Etkinlik sürüklenirken, bırakmadan önce hedef sütun ve hedef saatte canlı olarak “havada” görünecek.
6. Yapı daha merkezi olacak: tarih, görünüm ve grid hesapları aynı takvim mantığı etrafında toparlanacak.

## Uygulama adımları

### 1) Takvim sayfasının yerleşimini tam ekran kullanacak şekilde düzenle

`src/routes/takvim.tsx`

- Mevcut `max-w-7xl` sınırını kaldıracağım; bu sınır takvimi gereksiz şekilde daraltıyor.
- Ana düzeni “takvim alanı + görev paneli” olarak yeniden kuracağım.
- Masaüstünde takvim ana alanı ekran genişliğinin çoğunu alacak, görev paneli sabit/genişliği kontrollü bir yan panel olacak.
- Dar ekranlarda görev panelini alta itmek yerine opsiyonel daraltılmış/drawer mantığına yaklaştıracağım; böylece takvim yüksekliğini yemeyecek.
- Yükseklik hesabını topbar ve alt bar ile uyumlu hale getirip iç scroll’u sadece takvim gövdesine vereceğim.

### 2) Gün ve hafta görünümünü ortak bir 24 saat grid mantığına oturt

`src/components/mizan/takvim/gun-gorunumu.tsx`
`src/components/mizan/takvim/hafta-gorunumu.tsx`

- 24 saatlik zaman ekseni tek mantıkla çalışacak.
- Etkinlik konumu ve yüksekliği tamamen dakika tabanlı hesaplanacak.
- Grid yüksekliği, saat satırları ve overlay hesapları ortak kurala bağlanacak.
- “Saat 20’den sonrası görünmüyor” hissini yaratan sıkışık container/scroll ilişkisini kaldıracağım.
- Hafta görünümünde sütun başlıkları sabit, zaman alanı kaydırılabilir olacak; böylece kullanım daha tanıdık hale gelecek.

### 3) Sürükleme motorunu Google Calendar mantığına yaklaştır

`src/lib/takvim-surukle.ts`

- Sürükleme sırasında dış sayfa scroll’unu kilitleyeceğim.
- Sadece takvim içindeki scroll yönetilecek; pointer ile kartın ilişkisi scroll sırasında bozulmayacak.
- Başlangıç referansı, container rect’i ve scroll offset’i tek bir koordinat sistemine bağlanacak.
- Auto-scroll mantığını üst/alt kenar yakınlığında daha kontrollü hale getireceğim; şu anki zıplama hissini bu düzeltecek.
- Drag state içine canlı hedef zaman ve hedef sütun bilgisini açıkça ekleyeceğim; bırakınca yeniden hesap yapmak yerine sürükleme boyunca aynı hedef kullanılacak.

### 4) Canlı sürükleme önizlemesini gerçek hedefe taşı

`src/components/mizan/takvim/gun-gorunumu.tsx`
`src/components/mizan/takvim/hafta-gorunumu.tsx`

- Şu an etkinlik çoğunlukla kendi sütununda kalıyor; bunu değiştireceğim.
- Sürükleme sırasında orijinal kart soluk kalacak.
- Ayrı bir preview/ghost kart, pointer’ın bulunduğu sütun ve saate anlık taşınacak.
- Bu preview bırakınca gideceği yeri önceden gösterecek.
- Haftalık görünümde sütun değişimi pointer’ın yatay konumuna göre canlı güncellenecek.

### 5) Görünüm modları ve tarih yönetimini biraz daha merkezi hale getir

`src/routes/takvim.tsx`

- `currentDate` ve `view` zaten burada tutuluyor; bunu daha net “takvim kontrol merkezi” haline getireceğim.
- Gün/hafta/ay hesapları aynı referans tarihten üretilecek.
- Header, grid ve olay filtreleme aynı tarih aralığı mantığını paylaşacak.
- Böylece ileride Google Calendar’daki gibi daha gelişmiş navigation davranışları eklemek kolaylaşacak.

### 6) Çakışan etkinlik yerleşimini bozmadan iyileştir

`src/lib/takvim-cakisma.ts`

- Mevcut çakışma yerleşimi temel olarak doğru; onu koruyacağım.
- Ancak drag preview sırasında hedef sütunda yeni konumu hesaplarken görsel çakışma davranışını daha tutarlı hale getireceğim.
- Böylece hem normal çizim hem sürükleme esnasındaki görünüm aynı mantığı izleyecek.

## Teknik notlar

- Genişlik sorununun ana sebeplerinden biri: `src/routes/takvim.tsx` içindeki `max-w-7xl` sınırı.
- Kullanılabilir yükseklik kaybının ana sebepleri:
  - route seviyesinde sabit `100dvh - ...` hesapları,
  - app shell içindeki alt bar padding’i,
  - görev panelinin aynı dikey alanı paylaşması.
- Hafta görünümünde 24 saat zaten var, fakat görünür alan ve scroll davranışı yüzünden alt saatler pratikte erişilemez hissediliyor.
- Canlı preview şu an ayrı overlay ile var, ama hedef sütun/saat ile tam senkron değil; bunu state tarafında netleştireceğim.

## Değişecek dosyalar

- `src/routes/takvim.tsx`
- `src/components/mizan/takvim/hafta-gorunumu.tsx`
- `src/components/mizan/takvim/gun-gorunumu.tsx`
- `src/components/mizan/takvim/gorev-paneli.tsx`
- `src/lib/takvim-surukle.ts`
- Gerekirse küçük destek düzenlemesi için: `src/components/mizan/app-shell.tsx`

## Beklenen sonuç

Bu plan sonunda takvim:

- daha geniş,
- daha uzun,
- akşam saatleri erişilebilir,
- sürüklerken sabit,
- canlı hedef preview’li,
- ve Google Calendar’a çok daha yakın davranan bir yapıya geçecek.  
  
Create a full-featured Google Calendar clone with the following complete specifications:
  ## CORE FEATURES
  1. **Calendar Views:**
     - Month view (default) showing all days in a grid with events visible
     - Week view with hourly time slots from 00:00 to 23:00
     - Day view with detailed hourly breakdown
     - Year view showing all 12 months in a grid
     - Smooth transitions between views with animations
  2. **Navigation:**
     - Today button to jump back to current date
     - Previous/Next buttons for navigating months/weeks/days
     - Date picker mini calendar in sidebar
     - Keyboard shortcuts: 'T' for today, 'M' for month, 'W' for week, 'D' for day, arrow keys for navigation
  3. **Event Management:**
     - Click on any day/time to create new event with modal form
     - Event fields: title (required), description, start date/time, end date/time, all-day toggle, location, color label (8 colors), reminders (None, 5min, 15min, 30min, 1hour, 1day before)
     - Edit existing events by clicking on them
     - Delete events with confirmation dialog
     - Drag and drop events to reschedule
     - Resize events vertically to change duration (week/day view)
     - Duplicate events
     - Recurring events: does not repeat, daily, weekly, bi-weekly, monthly, yearly, custom
  4. **Multiple Calendars:**
     - Create multiple calendars (Personal, Work, Family, etc.)
     - Each calendar has its own color
     - Toggle calendar visibility with checkboxes in sidebar
     - Default calendar selection when creating events
  5. **Event Display:**
     - Events shown as colored blocks with title and time
     - Multi-day events span across days in month/week view
     - All-day events shown at top in week/day view
     - Time indicator (red line) showing current time in week/day views
     - Overlapping events displayed side by side
     - Tooltip on hover showing full event details
  6. **Sidebar:**
     - Mini calendar for quick date selection
     - List of user's calendars with color indicators and toggles
     - "Create new calendar" button
     - Upcoming events list (next 7 days)
     - Search events input
  7. **Search & Filter:**
     - Search bar to find events by title/description
     - Filter events by calendar
     - Search results displayed in a dropdown/list
     - Click result to navigate to that event's date
  8. **UI/UX Requirements:**
     - Clean, modern Google-like design with proper spacing and typography
     - Responsive design (works on mobile and desktop)
     - Mobile: swipe to change months, bottom navigation
     - Dark header bar like Google Calendar
     - Smooth animations and transitions
     - Loading states and empty states
     - Tooltips and proper hover effects
     - Show current date highlighted
     - Show today's date distinctly with blue circle
     - Current month/year displayed prominently in header
  9. **Data Persistence:**
     - Store all events and calendars in localStorage
     - Load saved state on app initialization
     - Export calendar as .ics file
     - Import .ics file functionality
     - Auto-save on any change
  10. **Technical Requirements:**
      - Use React with TypeScript
      - Use date-fns for date manipulation
      - Use shadcn/ui components where applicable
      - Use Tailwind CSS for styling
      - Implement proper state management (React Context or Zustand)
      - Handle timezone awareness
      - Proper error handling
      - Type safety throughout
  11. **Event Reminders:**
      - Browser notification API for reminders
      - Visual notification popup in app for upcoming events
      - Badge showing number of events today
  12. **Additional Features:**
      - Right-click context menu on events (edit, delete, duplicate, change color)
      - Drag to select multiple time slots in week/day view
      - Event color customization (8 preset colors)
      - Week numbers displayed in month view
      - "Working hours" highlight (9-17) in week/day view
      - Weekend days visually distinguished (lighter color)
      - Quick add event: type "Lunch tomorrow 12pm-1pm" with natural language
  ## IMPORTANT IMPLEMENTATION NOTES:
  - Make sure month view grid correctly shows events spanning multiple days
  - Ensure the current date is always clearly visible and highlighted
  - All buttons and interactions must be fully functional
  - The calendar must correctly calculate and display dates for any month/year
  - Events must be properly sorted and displayed without overlapping text
  - Mobile responsiveness is critical - test all views on mobile screens
  - Use proper TypeScript types for all data structures
  - Include proper error boundaries and fallback UI
  - Add aria labels and keyboard navigation for accessibility
  Start by creating the complete project structure and implement all features. Do not leave any placeholder or TODO comments - implement everything fully.