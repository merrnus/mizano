export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      amel_alan: {
        Row: {
          aciklama: string | null
          ad: string
          arsiv: boolean
          created_at: string
          id: string
          ikon: string | null
          renk: string | null
          siralama: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          arsiv?: boolean
          created_at?: string
          id?: string
          ikon?: string | null
          renk?: string | null
          siralama?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          arsiv?: boolean
          created_at?: string
          id?: string
          ikon?: string | null
          renk?: string | null
          siralama?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      amel_kaynak: {
        Row: {
          baslik: string
          created_at: string
          icerik: string | null
          id: string
          kurs_id: string
          siralama: number
          storage_path: string | null
          tip: Database["public"]["Enums"]["amel_kaynak_tip"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          baslik: string
          created_at?: string
          icerik?: string | null
          id?: string
          kurs_id: string
          siralama?: number
          storage_path?: string | null
          tip?: Database["public"]["Enums"]["amel_kaynak_tip"]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          baslik?: string
          created_at?: string
          icerik?: string | null
          id?: string
          kurs_id?: string
          siralama?: number
          storage_path?: string | null
          tip?: Database["public"]["Enums"]["amel_kaynak_tip"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amel_kaynak_kurs_id_fkey"
            columns: ["kurs_id"]
            isOneToOne: false
            referencedRelation: "amel_kurs"
            referencedColumns: ["id"]
          },
        ]
      }
      amel_kurs: {
        Row: {
          aciklama: string | null
          ad: string
          alan_id: string
          baslangic: string | null
          bitis: string | null
          created_at: string
          durum: Database["public"]["Enums"]["amel_kurs_durum"]
          id: string
          kod: string | null
          notlar: string | null
          saglayici: string | null
          sertifika_konum: string | null
          sertifika_tarihi: string | null
          siralama: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          alan_id: string
          baslangic?: string | null
          bitis?: string | null
          created_at?: string
          durum?: Database["public"]["Enums"]["amel_kurs_durum"]
          id?: string
          kod?: string | null
          notlar?: string | null
          saglayici?: string | null
          sertifika_konum?: string | null
          sertifika_tarihi?: string | null
          siralama?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          alan_id?: string
          baslangic?: string | null
          bitis?: string | null
          created_at?: string
          durum?: Database["public"]["Enums"]["amel_kurs_durum"]
          id?: string
          kod?: string | null
          notlar?: string | null
          saglayici?: string | null
          sertifika_konum?: string | null
          sertifika_tarihi?: string | null
          siralama?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amel_kurs_alan_id_fkey"
            columns: ["alan_id"]
            isOneToOne: false
            referencedRelation: "amel_alan"
            referencedColumns: ["id"]
          },
        ]
      }
      amel_modul: {
        Row: {
          aciklama: string | null
          baslik: string
          created_at: string
          id: string
          kurs_id: string
          notlar: string | null
          siralama: number
          tamamlandi: boolean
          tamamlanma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          baslik: string
          created_at?: string
          id?: string
          kurs_id: string
          notlar?: string | null
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          baslik?: string
          created_at?: string
          id?: string
          kurs_id?: string
          notlar?: string | null
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amel_modul_kurs_id_fkey"
            columns: ["kurs_id"]
            isOneToOne: false
            referencedRelation: "amel_kurs"
            referencedColumns: ["id"]
          },
        ]
      }
      amel_proje: {
        Row: {
          aciklama: string | null
          ad: string
          alan_id: string | null
          baslangic: string | null
          created_at: string
          deadline: string | null
          durum: Database["public"]["Enums"]["amel_proje_durum"]
          id: string
          kurs_id: string | null
          notlar: string | null
          repo_url: string | null
          siralama: number
          tamamlanma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          alan_id?: string | null
          baslangic?: string | null
          created_at?: string
          deadline?: string | null
          durum?: Database["public"]["Enums"]["amel_proje_durum"]
          id?: string
          kurs_id?: string | null
          notlar?: string | null
          repo_url?: string | null
          siralama?: number
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          alan_id?: string | null
          baslangic?: string | null
          created_at?: string
          deadline?: string | null
          durum?: Database["public"]["Enums"]["amel_proje_durum"]
          id?: string
          kurs_id?: string | null
          notlar?: string | null
          repo_url?: string | null
          siralama?: number
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amel_proje_alan_id_fkey"
            columns: ["alan_id"]
            isOneToOne: false
            referencedRelation: "amel_alan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amel_proje_kurs_id_fkey"
            columns: ["kurs_id"]
            isOneToOne: false
            referencedRelation: "amel_kurs"
            referencedColumns: ["id"]
          },
        ]
      }
      amel_proje_adim: {
        Row: {
          aciklama: string | null
          baslik: string
          created_at: string
          id: string
          proje_id: string
          siralama: number
          tamamlandi: boolean
          tamamlanma: string | null
          updated_at: string
          user_id: string
          vade: string | null
        }
        Insert: {
          aciklama?: string | null
          baslik: string
          created_at?: string
          id?: string
          proje_id: string
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
          vade?: string | null
        }
        Update: {
          aciklama?: string | null
          baslik?: string
          created_at?: string
          id?: string
          proje_id?: string
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
          vade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amel_proje_adim_proje_id_fkey"
            columns: ["proje_id"]
            isOneToOne: false
            referencedRelation: "amel_proje"
            referencedColumns: ["id"]
          },
        ]
      }
      cetele_kayit: {
        Row: {
          created_at: string
          id: string
          miktar: number
          not_metni: string | null
          sablon_id: string
          tarih: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          miktar?: number
          not_metni?: string | null
          sablon_id: string
          tarih: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          miktar?: number
          not_metni?: string | null
          sablon_id?: string
          tarih?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cetele_kayit_sablon_id_fkey"
            columns: ["sablon_id"]
            isOneToOne: false
            referencedRelation: "cetele_sablon"
            referencedColumns: ["id"]
          },
        ]
      }
      cetele_sablon: {
        Row: {
          ad: string
          aktif: boolean
          alan: Database["public"]["Enums"]["cetele_alan"]
          birim: Database["public"]["Enums"]["cetele_birim"]
          created_at: string
          hedef_deger: number
          hedef_tipi: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id: string
          notlar: string | null
          siralama: number
          uc_aylik_baslangic: string | null
          uc_aylik_hedef: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad: string
          aktif?: boolean
          alan?: Database["public"]["Enums"]["cetele_alan"]
          birim: Database["public"]["Enums"]["cetele_birim"]
          created_at?: string
          hedef_deger?: number
          hedef_tipi?: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id?: string
          notlar?: string | null
          siralama?: number
          uc_aylik_baslangic?: string | null
          uc_aylik_hedef?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad?: string
          aktif?: boolean
          alan?: Database["public"]["Enums"]["cetele_alan"]
          birim?: Database["public"]["Enums"]["cetele_birim"]
          created_at?: string
          hedef_deger?: number
          hedef_tipi?: Database["public"]["Enums"]["cetele_hedef_tipi"]
          id?: string
          notlar?: string | null
          siralama?: number
          uc_aylik_baslangic?: string | null
          uc_aylik_hedef?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ders: {
        Row: {
          ad: string
          created_at: string
          donem: string | null
          durum: Database["public"]["Enums"]["ders_durum"]
          etiketler: string[]
          gecme_baraji: number | null
          hoca: string | null
          id: string
          kod: string | null
          kredi: number | null
          notlar: string | null
          restant: boolean
          siralama: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ad: string
          created_at?: string
          donem?: string | null
          durum?: Database["public"]["Enums"]["ders_durum"]
          etiketler?: string[]
          gecme_baraji?: number | null
          hoca?: string | null
          id?: string
          kod?: string | null
          kredi?: number | null
          notlar?: string | null
          restant?: boolean
          siralama?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ad?: string
          created_at?: string
          donem?: string | null
          durum?: Database["public"]["Enums"]["ders_durum"]
          etiketler?: string[]
          gecme_baraji?: number | null
          hoca?: string | null
          id?: string
          kod?: string | null
          kredi?: number | null
          notlar?: string | null
          restant?: boolean
          siralama?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ders_kaynak: {
        Row: {
          baslik: string
          created_at: string
          ders_id: string
          icerik: string | null
          id: string
          siralama: number
          storage_path: string | null
          tip: Database["public"]["Enums"]["ders_kaynak_tip"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          baslik: string
          created_at?: string
          ders_id: string
          icerik?: string | null
          id?: string
          siralama?: number
          storage_path?: string | null
          tip?: Database["public"]["Enums"]["ders_kaynak_tip"]
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          baslik?: string
          created_at?: string
          ders_id?: string
          icerik?: string | null
          id?: string
          siralama?: number
          storage_path?: string | null
          tip?: Database["public"]["Enums"]["ders_kaynak_tip"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ders_kaynak_ders_id_fkey"
            columns: ["ders_id"]
            isOneToOne: false
            referencedRelation: "ders"
            referencedColumns: ["id"]
          },
        ]
      }
      ders_proje: {
        Row: {
          aciklama: string | null
          baslik: string
          created_at: string
          deadline: string | null
          ders_id: string
          id: string
          modul_no: number | null
          siralama: number
          tamamlandi: boolean
          tamamlanma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          baslik: string
          created_at?: string
          deadline?: string | null
          ders_id: string
          id?: string
          modul_no?: number | null
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          baslik?: string
          created_at?: string
          deadline?: string | null
          ders_id?: string
          id?: string
          modul_no?: number | null
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ders_proje_ders_id_fkey"
            columns: ["ders_id"]
            isOneToOne: false
            referencedRelation: "ders"
            referencedColumns: ["id"]
          },
        ]
      }
      ders_saat: {
        Row: {
          baslangic: string
          bitis: string
          created_at: string
          ders_id: string
          gun: Database["public"]["Enums"]["hafta_gun"]
          id: string
          konum: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baslangic: string
          bitis: string
          created_at?: string
          ders_id: string
          gun: Database["public"]["Enums"]["hafta_gun"]
          id?: string
          konum?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baslangic?: string
          bitis?: string
          created_at?: string
          ders_id?: string
          gun?: Database["public"]["Enums"]["hafta_gun"]
          id?: string
          konum?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ders_saat_ders_id_fkey"
            columns: ["ders_id"]
            isOneToOne: false
            referencedRelation: "ders"
            referencedColumns: ["id"]
          },
        ]
      }
      ders_sinav: {
        Row: {
          agirlik: number | null
          alinan_not: number | null
          baslik: string | null
          created_at: string
          ders_id: string
          id: string
          notlar: string | null
          tarih: string | null
          tip: Database["public"]["Enums"]["ders_sinav_tip"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agirlik?: number | null
          alinan_not?: number | null
          baslik?: string | null
          created_at?: string
          ders_id: string
          id?: string
          notlar?: string | null
          tarih?: string | null
          tip?: Database["public"]["Enums"]["ders_sinav_tip"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agirlik?: number | null
          alinan_not?: number | null
          baslik?: string | null
          created_at?: string
          ders_id?: string
          id?: string
          notlar?: string | null
          tarih?: string | null
          tip?: Database["public"]["Enums"]["ders_sinav_tip"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ders_sinav_ders_id_fkey"
            columns: ["ders_id"]
            isOneToOne: false
            referencedRelation: "ders"
            referencedColumns: ["id"]
          },
        ]
      }
      gundem: {
        Row: {
          created_at: string
          deadline: string | null
          durum: Database["public"]["Enums"]["gundem_durum"]
          etiketler: string[]
          icerik: string
          id: string
          istisare_id: string
          karar: string | null
          oncelik: Database["public"]["Enums"]["gundem_oncelik"]
          siralama: number
          tamamlanma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          durum?: Database["public"]["Enums"]["gundem_durum"]
          etiketler?: string[]
          icerik: string
          id?: string
          istisare_id: string
          karar?: string | null
          oncelik?: Database["public"]["Enums"]["gundem_oncelik"]
          siralama?: number
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          durum?: Database["public"]["Enums"]["gundem_durum"]
          etiketler?: string[]
          icerik?: string
          id?: string
          istisare_id?: string
          karar?: string | null
          oncelik?: Database["public"]["Enums"]["gundem_oncelik"]
          siralama?: number
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gundem_kategori: {
        Row: {
          ad: string
          created_at: string
          id: string
          renk: string | null
          siralama: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ad: string
          created_at?: string
          id?: string
          renk?: string | null
          siralama?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ad?: string
          created_at?: string
          id?: string
          renk?: string | null
          siralama?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gundem_kisi: {
        Row: {
          ad: string
          akademik_durum: string | null
          bolum: string | null
          created_at: string
          derin_takip: boolean
          dogum_tarihi: string | null
          foto_url: string | null
          gano: number | null
          id: string
          ilgi_alanlari: string[]
          notlar: string | null
          sinif: string | null
          sorumluluk_notu: string | null
          telefon: string | null
          universite: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad: string
          akademik_durum?: string | null
          bolum?: string | null
          created_at?: string
          derin_takip?: boolean
          dogum_tarihi?: string | null
          foto_url?: string | null
          gano?: number | null
          id?: string
          ilgi_alanlari?: string[]
          notlar?: string | null
          sinif?: string | null
          sorumluluk_notu?: string | null
          telefon?: string | null
          universite?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad?: string
          akademik_durum?: string | null
          bolum?: string | null
          created_at?: string
          derin_takip?: boolean
          dogum_tarihi?: string | null
          foto_url?: string | null
          gano?: number | null
          id?: string
          ilgi_alanlari?: string[]
          notlar?: string | null
          sinif?: string | null
          sorumluluk_notu?: string | null
          telefon?: string | null
          universite?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gundem_kisi_kategori: {
        Row: {
          created_at: string
          kategori_id: string
          kisi_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kategori_id: string
          kisi_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          kategori_id?: string
          kisi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gundem_sorumlu: {
        Row: {
          created_at: string
          gundem_id: string
          kisi_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gundem_id: string
          kisi_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          gundem_id?: string
          kisi_id?: string
          user_id?: string
        }
        Relationships: []
      }
      gundem_yorum: {
        Row: {
          created_at: string
          gundem_id: string
          id: string
          metin: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gundem_id: string
          id?: string
          metin: string
          user_id: string
        }
        Update: {
          created_at?: string
          gundem_id?: string
          id?: string
          metin?: string
          user_id?: string
        }
        Relationships: []
      }
      hedef: {
        Row: {
          aciklama: string | null
          ad: string
          alan: Database["public"]["Enums"]["cetele_alan"]
          baslangic: string
          birim: string | null
          bitis: string | null
          created_at: string
          durum: Database["public"]["Enums"]["hedef_durum"]
          hedef_miktar: number | null
          id: string
          notlar: string | null
          sablon_id: string | null
          siralama: number
          streak_birim: Database["public"]["Enums"]["streak_birim"] | null
          tamamlanma: string | null
          tip: Database["public"]["Enums"]["hedef_tip"]
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          ad: string
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslangic?: string
          birim?: string | null
          bitis?: string | null
          created_at?: string
          durum?: Database["public"]["Enums"]["hedef_durum"]
          hedef_miktar?: number | null
          id?: string
          notlar?: string | null
          sablon_id?: string | null
          siralama?: number
          streak_birim?: Database["public"]["Enums"]["streak_birim"] | null
          tamamlanma?: string | null
          tip: Database["public"]["Enums"]["hedef_tip"]
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          ad?: string
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslangic?: string
          birim?: string | null
          bitis?: string | null
          created_at?: string
          durum?: Database["public"]["Enums"]["hedef_durum"]
          hedef_miktar?: number | null
          id?: string
          notlar?: string | null
          sablon_id?: string | null
          siralama?: number
          streak_birim?: Database["public"]["Enums"]["streak_birim"] | null
          tamamlanma?: string | null
          tip?: Database["public"]["Enums"]["hedef_tip"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hedef_sablon_id_fkey"
            columns: ["sablon_id"]
            isOneToOne: false
            referencedRelation: "cetele_sablon"
            referencedColumns: ["id"]
          },
        ]
      }
      hedef_adim: {
        Row: {
          aciklama: string | null
          baslik: string
          created_at: string
          hedef_id: string
          id: string
          siralama: number
          tamamlandi: boolean
          tamamlanma: string | null
          updated_at: string
          user_id: string
          vade: string | null
        }
        Insert: {
          aciklama?: string | null
          baslik: string
          created_at?: string
          hedef_id: string
          id?: string
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id: string
          vade?: string | null
        }
        Update: {
          aciklama?: string | null
          baslik?: string
          created_at?: string
          hedef_id?: string
          id?: string
          siralama?: number
          tamamlandi?: boolean
          tamamlanma?: string | null
          updated_at?: string
          user_id?: string
          vade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hedef_adim_hedef_id_fkey"
            columns: ["hedef_id"]
            isOneToOne: false
            referencedRelation: "hedef"
            referencedColumns: ["id"]
          },
        ]
      }
      istisare: {
        Row: {
          baslik: string
          created_at: string
          id: string
          notlar: string | null
          tarih: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baslik?: string
          created_at?: string
          id?: string
          notlar?: string | null
          tarih?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baslik?: string
          created_at?: string
          id?: string
          notlar?: string | null
          tarih?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kardes_etkinlik: {
        Row: {
          baslangic_saati: string | null
          baslik: string
          bitis_saati: string | null
          created_at: string
          id: string
          kisi_id: string
          notlar: string | null
          sonuc: string | null
          takvim_etkinlik_id: string | null
          tarih: string
          tip: Database["public"]["Enums"]["kardes_etkinlik_tip"]
          updated_at: string
          user_id: string
        }
        Insert: {
          baslangic_saati?: string | null
          baslik: string
          bitis_saati?: string | null
          created_at?: string
          id?: string
          kisi_id: string
          notlar?: string | null
          sonuc?: string | null
          takvim_etkinlik_id?: string | null
          tarih?: string
          tip: Database["public"]["Enums"]["kardes_etkinlik_tip"]
          updated_at?: string
          user_id: string
        }
        Update: {
          baslangic_saati?: string | null
          baslik?: string
          bitis_saati?: string | null
          created_at?: string
          id?: string
          kisi_id?: string
          notlar?: string | null
          sonuc?: string | null
          takvim_etkinlik_id?: string | null
          tarih?: string
          tip?: Database["public"]["Enums"]["kardes_etkinlik_tip"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardes_etkinlik_takvim_etkinlik_id_fkey"
            columns: ["takvim_etkinlik_id"]
            isOneToOne: false
            referencedRelation: "takvim_etkinlik"
            referencedColumns: ["id"]
          },
        ]
      }
      kardes_evrad_kayit: {
        Row: {
          created_at: string
          id: string
          kisi_id: string
          madde_id: string
          tarih: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kisi_id: string
          madde_id: string
          tarih: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kisi_id?: string
          madde_id?: string
          tarih?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardes_evrad_kayit_kisi_id_fkey"
            columns: ["kisi_id"]
            isOneToOne: false
            referencedRelation: "gundem_kisi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kardes_evrad_kayit_madde_id_fkey"
            columns: ["madde_id"]
            isOneToOne: false
            referencedRelation: "kardes_evrad_madde"
            referencedColumns: ["id"]
          },
        ]
      }
      kardes_evrad_madde: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kisi_id: string
          metin: string
          siralama: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kisi_id: string
          metin: string
          siralama?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kisi_id?: string
          metin?: string
          siralama?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardes_evrad_madde_kisi_id_fkey"
            columns: ["kisi_id"]
            isOneToOne: false
            referencedRelation: "gundem_kisi"
            referencedColumns: ["id"]
          },
        ]
      }
      kardes_mufredat: {
        Row: {
          arsiv: boolean
          baslangic: string | null
          baslik: string
          bitis: string | null
          created_at: string
          id: string
          kisi_id: string
          maddeler: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          arsiv?: boolean
          baslangic?: string | null
          baslik?: string
          bitis?: string | null
          created_at?: string
          id?: string
          kisi_id: string
          maddeler?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          arsiv?: boolean
          baslangic?: string | null
          baslik?: string
          bitis?: string | null
          created_at?: string
          id?: string
          kisi_id?: string
          maddeler?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardes_mufredat_kisi_id_fkey"
            columns: ["kisi_id"]
            isOneToOne: false
            referencedRelation: "gundem_kisi"
            referencedColumns: ["id"]
          },
        ]
      }
      mutfak_belge: {
        Row: {
          baslik: string
          created_at: string
          emoji: string | null
          icerik: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baslik?: string
          created_at?: string
          emoji?: string | null
          icerik?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baslik?: string
          created_at?: string
          emoji?: string | null
          icerik?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mutfak_dosya: {
        Row: {
          ad: string
          boyut: number
          created_at: string
          id: string
          klasor: string
          mime_type: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          ad: string
          boyut?: number
          created_at?: string
          id?: string
          klasor?: string
          mime_type?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          ad?: string
          boyut?: number
          created_at?: string
          id?: string
          klasor?: string
          mime_type?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      mutfak_not: {
        Row: {
          arsiv: boolean
          baslik: string | null
          created_at: string
          etiketler: string[]
          icerik: string
          id: string
          pinned: boolean
          renk: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arsiv?: boolean
          baslik?: string | null
          created_at?: string
          etiketler?: string[]
          icerik?: string
          id?: string
          pinned?: boolean
          renk?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arsiv?: boolean
          baslik?: string | null
          created_at?: string
          etiketler?: string[]
          icerik?: string
          id?: string
          pinned?: boolean
          renk?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mutfak_tablo: {
        Row: {
          baslik: string
          created_at: string
          id: string
          kolonlar: Json
          satirlar: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          baslik?: string
          created_at?: string
          id?: string
          kolonlar?: Json
          satirlar?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          baslik?: string
          created_at?: string
          id?: string
          kolonlar?: Json
          satirlar?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      takvim_etkinlik: {
        Row: {
          aciklama: string | null
          alan: Database["public"]["Enums"]["cetele_alan"]
          baslangic: string
          baslik: string
          bitis: string | null
          created_at: string
          id: string
          konum: string | null
          tekrar: Database["public"]["Enums"]["takvim_tekrar"]
          tekrar_bitis: string | null
          tum_gun: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          aciklama?: string | null
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslangic: string
          baslik: string
          bitis?: string | null
          created_at?: string
          id?: string
          konum?: string | null
          tekrar?: Database["public"]["Enums"]["takvim_tekrar"]
          tekrar_bitis?: string | null
          tum_gun?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          aciklama?: string | null
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslangic?: string
          baslik?: string
          bitis?: string | null
          created_at?: string
          id?: string
          konum?: string | null
          tekrar?: Database["public"]["Enums"]["takvim_tekrar"]
          tekrar_bitis?: string | null
          tum_gun?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      takvim_gorev: {
        Row: {
          aciklama: string | null
          alan: Database["public"]["Enums"]["cetele_alan"]
          baslik: string
          created_at: string
          id: string
          oncelik: Database["public"]["Enums"]["gorev_oncelik"]
          tamamlandi: boolean
          updated_at: string
          user_id: string
          vade: string
        }
        Insert: {
          aciklama?: string | null
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslik: string
          created_at?: string
          id?: string
          oncelik?: Database["public"]["Enums"]["gorev_oncelik"]
          tamamlandi?: boolean
          updated_at?: string
          user_id: string
          vade: string
        }
        Update: {
          aciklama?: string | null
          alan?: Database["public"]["Enums"]["cetele_alan"]
          baslik?: string
          created_at?: string
          id?: string
          oncelik?: Database["public"]["Enums"]["gorev_oncelik"]
          tamamlandi?: boolean
          updated_at?: string
          user_id?: string
          vade?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      amel_kaynak_tip: "link" | "dosya" | "resim" | "not" | "lab"
      amel_kurs_durum: "planli" | "aktif" | "tamam"
      amel_proje_durum: "planli" | "devam" | "beklemede" | "tamam" | "iptal"
      cetele_alan: "mana" | "ilim" | "amel" | "kisisel"
      cetele_birim: "sayfa" | "adet" | "dakika" | "ikili"
      cetele_hedef_tipi: "gunluk" | "haftalik" | "esnek"
      ders_durum: "izliyor" | "birakti" | "gecti" | "restant"
      ders_kaynak_tip: "link" | "dosya" | "resim" | "not"
      ders_sinav_tip: "vize" | "final" | "quiz" | "odev" | "proje" | "butunleme"
      gorev_oncelik: "dusuk" | "orta" | "yuksek"
      gundem_durum: "bekliyor" | "yapiliyor" | "yapildi" | "ertelendi"
      gundem_oncelik: "ana" | "yan"
      hafta_gun:
        | "pazartesi"
        | "sali"
        | "carsamba"
        | "persembe"
        | "cuma"
        | "cumartesi"
        | "pazar"
      hedef_durum: "aktif" | "tamamlandi" | "arsiv"
      hedef_tip: "kurs" | "aliskanlik" | "proje" | "sayisal" | "tekil"
      kardes_etkinlik_tip:
        | "sohbet"
        | "istisare"
        | "kuran"
        | "sophia"
        | "kamp"
        | "sinav"
        | "yarisma"
        | "hediye"
        | "gezi"
        | "spor"
        | "teke_tek"
        | "dogum_gunu"
        | "kandil"
        | "zoom"
      streak_birim: "gunluk" | "haftalik"
      takvim_tekrar: "yok" | "haftalik" | "aylik"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      amel_kaynak_tip: ["link", "dosya", "resim", "not", "lab"],
      amel_kurs_durum: ["planli", "aktif", "tamam"],
      amel_proje_durum: ["planli", "devam", "beklemede", "tamam", "iptal"],
      cetele_alan: ["mana", "ilim", "amel", "kisisel"],
      cetele_birim: ["sayfa", "adet", "dakika", "ikili"],
      cetele_hedef_tipi: ["gunluk", "haftalik", "esnek"],
      ders_durum: ["izliyor", "birakti", "gecti", "restant"],
      ders_kaynak_tip: ["link", "dosya", "resim", "not"],
      ders_sinav_tip: ["vize", "final", "quiz", "odev", "proje", "butunleme"],
      gorev_oncelik: ["dusuk", "orta", "yuksek"],
      gundem_durum: ["bekliyor", "yapiliyor", "yapildi", "ertelendi"],
      gundem_oncelik: ["ana", "yan"],
      hafta_gun: [
        "pazartesi",
        "sali",
        "carsamba",
        "persembe",
        "cuma",
        "cumartesi",
        "pazar",
      ],
      hedef_durum: ["aktif", "tamamlandi", "arsiv"],
      hedef_tip: ["kurs", "aliskanlik", "proje", "sayisal", "tekil"],
      kardes_etkinlik_tip: [
        "sohbet",
        "istisare",
        "kuran",
        "sophia",
        "kamp",
        "sinav",
        "yarisma",
        "hediye",
        "gezi",
        "spor",
        "teke_tek",
        "dogum_gunu",
        "kandil",
        "zoom",
      ],
      streak_birim: ["gunluk", "haftalik"],
      takvim_tekrar: ["yok", "haftalik", "aylik"],
    },
  },
} as const
