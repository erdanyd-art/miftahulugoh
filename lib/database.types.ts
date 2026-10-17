
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "absensi_murid": {
                  Row: {
                    "hadir": boolean,"peserta_id": string,"sesi_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "hadir": boolean,"peserta_id": string,"sesi_id": string
                  }
                  Update: {
                    "hadir"?: boolean,"peserta_id"?: string,"sesi_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "absensi_murid_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "absensi_murid_sesi_id_fkey"
      columns: ["sesi_id"]
isOneToOne: false
      referencedRelation: "sesi"
      referencedColumns: ["id"]
    }
                  ]
                },"audio_ujian": {
                  Row: {
                    "dibuat_pada": string,"id": string,"judul": string,"path": string,"ujian_id": string,"ukuran": number
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_pada"?: string,"id"?: string,"judul": string,"path": string,"ujian_id": string,"ukuran": number
                  }
                  Update: {
                    "dibuat_pada"?: string,"id"?: string,"judul"?: string,"path"?: string,"ujian_id"?: string,"ukuran"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "audio_ujian_ujian_id_fkey"
      columns: ["ujian_id"]
isOneToOne: false
      referencedRelation: "ujian"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_log": {
                  Row: {
                    "aksi": string,"baris_id": string | null,"id": number,"pengguna_id": string | null,"sebelum": Json | null,"sesudah": Json | null,"tabel": string,"waktu": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aksi": string,"baris_id"?: string | null,"id"?: never,"pengguna_id"?: string | null,"sebelum"?: Json | null,"sesudah"?: Json | null,"tabel": string,"waktu"?: string
                  }
                  Update: {
                    "aksi"?: string,"baris_id"?: string | null,"id"?: never,"pengguna_id"?: string | null,"sebelum"?: Json | null,"sesudah"?: Json | null,"tabel"?: string,"waktu"?: string
                  }
                  Relationships: [
                    
                  ]
                },"jadwal": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"diubah_pada": string,"hari": number,"honor": number,"id": string,"jam_mulai": string,"jam_selesai": string,"kelas_id": string,"meet_url": string | null,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"hari": number,"honor": number,"id"?: string,"jam_mulai": string,"jam_selesai": string,"kelas_id": string,"meet_url"?: string | null,"tutor_id": string
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"hari"?: number,"honor"?: number,"id"?: string,"jam_mulai"?: string,"jam_selesai"?: string,"kelas_id"?: string,"meet_url"?: string | null,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jadwal_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jadwal_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"jawaban": {
                  Row: {
                    "diperiksa_oleh": string | null,"diperiksa_pada": string | null,"disimpan_pada": string,"id": string,"isian": string | null,"percobaan_id": string,"pilihan": number | null,"skor_isian": number | null,"soal_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "diperiksa_oleh"?: string | null,"diperiksa_pada"?: string | null,"disimpan_pada"?: string,"id"?: string,"isian"?: string | null,"percobaan_id": string,"pilihan"?: number | null,"skor_isian"?: number | null,"soal_id": string
                  }
                  Update: {
                    "diperiksa_oleh"?: string | null,"diperiksa_pada"?: string | null,"disimpan_pada"?: string,"id"?: string,"isian"?: string | null,"percobaan_id"?: string,"pilihan"?: number | null,"skor_isian"?: number | null,"soal_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jawaban_diperiksa_oleh_fkey"
      columns: ["diperiksa_oleh"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jawaban_percobaan_id_fkey"
      columns: ["percobaan_id"]
isOneToOne: false
      referencedRelation: "percobaan_ujian"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jawaban_soal_id_fkey"
      columns: ["soal_id"]
isOneToOne: false
      referencedRelation: "soal"
      referencedColumns: ["id"]
    }
                  ]
                },"kas": {
                  Row: {
                    "dibuat_oleh": string | null,"dibuat_pada": string,"dihapus_pada": string | null,"diubah_pada": string,"id": string,"jenis": Database["public"]['Enums']["jenis_kas"],"jumlah": number,"kategori_id": string,"keterangan": string | null,"pembayaran_id": string | null,"tanggal": string,"tutor_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jenis": Database["public"]['Enums']["jenis_kas"],"jumlah": number,"kategori_id": string,"keterangan"?: string | null,"pembayaran_id"?: string | null,"tanggal": string,"tutor_id"?: string | null
                  }
                  Update: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jenis"?: Database["public"]['Enums']["jenis_kas"],"jumlah"?: number,"kategori_id"?: string,"keterangan"?: string | null,"pembayaran_id"?: string | null,"tanggal"?: string,"tutor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "kas_dibuat_oleh_fkey"
      columns: ["dibuat_oleh"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kas_kategori_id_fkey"
      columns: ["kategori_id"]
isOneToOne: false
      referencedRelation: "kategori_kas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kas_pembayaran_id_fkey"
      columns: ["pembayaran_id"]
isOneToOne: true
      referencedRelation: "pembayaran"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kas_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"kategori_kas": {
                  Row: {
                    "aktif": boolean,"butuh_tutor": boolean,"id": string,"jenis": Database["public"]['Enums']["jenis_kas"],"nama": string,"otomatis": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"butuh_tutor"?: boolean,"id"?: string,"jenis": Database["public"]['Enums']["jenis_kas"],"nama": string,"otomatis"?: boolean
                  }
                  Update: {
                    "aktif"?: boolean,"butuh_tutor"?: boolean,"id"?: string,"jenis"?: Database["public"]['Enums']["jenis_kas"],"nama"?: string,"otomatis"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"kelas": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"diubah_pada": string,"id": string,"keterangan": string | null,"nama": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"keterangan"?: string | null,"nama": string
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"keterangan"?: string | null,"nama"?: string
                  }
                  Relationships: [
                    
                  ]
                },"kelas_peserta": {
                  Row: {
                    "dibuat_pada": string,"kelas_id": string,"peserta_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_pada"?: string,"kelas_id": string,"peserta_id": string
                  }
                  Update: {
                    "dibuat_pada"?: string,"kelas_id"?: string,"peserta_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "kelas_peserta_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "kelas_peserta_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    }
                  ]
                },"pembayaran": {
                  Row: {
                    "dibuat_oleh": string | null,"dibuat_pada": string,"dihapus_pada": string | null,"diubah_pada": string,"id": string,"jumlah": number,"keterangan": string,"peserta_id": string,"status": Database["public"]['Enums']["status_pembayaran"],"tanggal": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jumlah": number,"keterangan": string,"peserta_id": string,"status"?: Database["public"]['Enums']["status_pembayaran"],"tanggal": string
                  }
                  Update: {
                    "dibuat_oleh"?: string | null,"dibuat_pada"?: string,"dihapus_pada"?: string | null,"diubah_pada"?: string,"id"?: string,"jumlah"?: number,"keterangan"?: string,"peserta_id"?: string,"status"?: Database["public"]['Enums']["status_pembayaran"],"tanggal"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pembayaran_dibuat_oleh_fkey"
      columns: ["dibuat_oleh"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pembayaran_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    }
                  ]
                },"pengaturan": {
                  Row: {
                    "id": boolean,"nama_lembaga": string,"zona_waktu": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: boolean,"nama_lembaga"?: string,"zona_waktu"?: string
                  }
                  Update: {
                    "id"?: boolean,"nama_lembaga"?: string,"zona_waktu"?: string
                  }
                  Relationships: [
                    
                  ]
                },"percobaan_ujian": {
                  Row: {
                    "batas_selesai": string,"id": string,"mulai_pada": string,"peserta_id": string,"selesai_pada": string | null,"ujian_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batas_selesai": string,"id"?: string,"mulai_pada"?: string,"peserta_id": string,"selesai_pada"?: string | null,"ujian_id": string
                  }
                  Update: {
                    "batas_selesai"?: string,"id"?: string,"mulai_pada"?: string,"peserta_id"?: string,"selesai_pada"?: string | null,"ujian_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "percobaan_ujian_peserta_id_fkey"
      columns: ["peserta_id"]
isOneToOne: false
      referencedRelation: "peserta"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "percobaan_ujian_ujian_id_fkey"
      columns: ["ujian_id"]
isOneToOne: false
      referencedRelation: "ujian"
      referencedColumns: ["id"]
    }
                  ]
                },"peserta": {
                  Row: {
                    "aktif": boolean,"catatan": string | null,"dibuat_pada": string,"diubah_pada": string,"id": string,"nama": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"catatan"?: string | null,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"nama": string,"user_id"?: string | null
                  }
                  Update: {
                    "aktif"?: boolean,"catatan"?: string | null,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"nama"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "aktif": boolean,"dibuat_pada": string,"id": string,"nama": string,"peran": Database["public"]['Enums']["peran_pengguna"],"wajib_ganti_sandi": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"id": string,"nama": string,"peran": Database["public"]['Enums']["peran_pengguna"],"wajib_ganti_sandi"?: boolean
                  }
                  Update: {
                    "aktif"?: boolean,"dibuat_pada"?: string,"id"?: string,"nama"?: string,"peran"?: Database["public"]['Enums']["peran_pengguna"],"wajib_ganti_sandi"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"sesi": {
                  Row: {
                    "dibuat_pada": string,"dikunci": boolean,"diubah_pada": string,"hadir": number,"honor": number,"honor_dikoreksi": boolean,"honor_standar": number,"id": string,"jadwal_id": string,"kelas_id": string,"tanggal": string,"total": number,"tutor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "dibuat_pada"?: string,"dikunci"?: boolean,"diubah_pada"?: string,"hadir"?: number,"honor": number,"honor_dikoreksi"?: boolean,"honor_standar": number,"id"?: string,"jadwal_id": string,"kelas_id": string,"tanggal": string,"total"?: number,"tutor_id": string
                  }
                  Update: {
                    "dibuat_pada"?: string,"dikunci"?: boolean,"diubah_pada"?: string,"hadir"?: number,"honor"?: number,"honor_dikoreksi"?: boolean,"honor_standar"?: number,"id"?: string,"jadwal_id"?: string,"kelas_id"?: string,"tanggal"?: string,"total"?: number,"tutor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sesi_jadwal_id_fkey"
      columns: ["jadwal_id"]
isOneToOne: false
      referencedRelation: "jadwal"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sesi_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sesi_tutor_id_fkey"
      columns: ["tutor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"soal": {
                  Row: {
                    "audio_id": string | null,"bobot": number,"dibuat_pada": string,"diubah_pada": string,"id": string,"jenis": Database["public"]['Enums']["jenis_soal"],"opsi": (string)[] | null,"pertanyaan": string,"ujian_id": string,"urutan": number
                  }
                  ComputedFields: never
                  Insert: {
                    "audio_id"?: string | null,"bobot"?: number,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"jenis": Database["public"]['Enums']["jenis_soal"],"opsi"?: (string)[] | null,"pertanyaan": string,"ujian_id": string,"urutan": number
                  }
                  Update: {
                    "audio_id"?: string | null,"bobot"?: number,"dibuat_pada"?: string,"diubah_pada"?: string,"id"?: string,"jenis"?: Database["public"]['Enums']["jenis_soal"],"opsi"?: (string)[] | null,"pertanyaan"?: string,"ujian_id"?: string,"urutan"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "soal_audio_id_ujian_id_fkey"
      columns: ["audio_id","ujian_id"]
isOneToOne: false
      referencedRelation: "audio_ujian"
      referencedColumns: ["id","ujian_id"]
    },{
      foreignKeyName: "soal_ujian_id_fkey"
      columns: ["ujian_id"]
isOneToOne: false
      referencedRelation: "ujian"
      referencedColumns: ["id"]
    }
                  ]
                },"soal_kunci": {
                  Row: {
                    "jawaban_benar": number | null,"kunci_isian": string | null,"soal_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "jawaban_benar"?: number | null,"kunci_isian"?: string | null,"soal_id": string
                  }
                  Update: {
                    "jawaban_benar"?: number | null,"kunci_isian"?: string | null,"soal_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "soal_kunci_soal_id_fkey"
      columns: ["soal_id"]
isOneToOne: true
      referencedRelation: "soal"
      referencedColumns: ["id"]
    }
                  ]
                },"ujian": {
                  Row: {
                    "acak_opsi": boolean,"acak_soal": boolean,"dibuat_pada": string,"diubah_pada": string,"diumumkan_pada": string | null,"durasi_menit": number,"id": string,"judul": string,"kelas_id": string,"keterangan": string | null,"mulai": string,"selesai": string,"terbit": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "acak_opsi"?: boolean,"acak_soal"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"diumumkan_pada"?: string | null,"durasi_menit": number,"id"?: string,"judul": string,"kelas_id": string,"keterangan"?: string | null,"mulai": string,"selesai": string,"terbit"?: boolean
                  }
                  Update: {
                    "acak_opsi"?: boolean,"acak_soal"?: boolean,"dibuat_pada"?: string,"diubah_pada"?: string,"diumumkan_pada"?: string | null,"durasi_menit"?: number,"id"?: string,"judul"?: string,"kelas_id"?: string,"keterangan"?: string | null,"mulai"?: string,"selesai"?: string,"terbit"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "ujian_kelas_id_fkey"
      columns: ["kelas_id"]
isOneToOne: false
      referencedRelation: "kelas"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "boleh_periksa":
{ Args: { "p_ujian_id": string }; Returns: boolean
                           },
"hasil_ujian":
{ Args: { "p_ujian_id": string }; Returns: {
              "isian_belum": number,"mulai_pada": string,"nama": string,"nilai": number,"percobaan_id": string,"peserta_id": string,"selesai_pada": string,"skor_isian": number,"skor_pg": number,"total_bobot": number
            }[]
                           },
"hubungkan_akun_peserta":
{ Args: { "p_peserta_id": string,"p_user_id": string }; Returns: undefined
                           },
"impor_peserta":
{ Args: { "p_baris": Json }; Returns: number
                           },
"impor_soal":
{ Args: { "p_baris": Json,"p_ujian_id": string }; Returns: number
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"isian_ujian":
{ Args: { "p_ujian_id": string }; Returns: {
              "acuan": string,"bobot": number,"isian": string,"jawaban_id": string,"nomor": number,"pertanyaan": string,"peserta": string,"skor_isian": number,"soal_id": string
            }[]
                           },
"jadwal_kelas_saya":
{ Args: Record<PropertyKey, never>; Returns: {
              "hari": number,"jadwal_id": string,"jam_mulai": string,"jam_selesai": string,"kelas": string,"meet_url": string,"tutor": string
            }[]
                           },
"jawaban_percobaan":
{ Args: { "p_percobaan_id": string }; Returns: {
              "acuan": string,"benar": boolean,"bobot": number,"isian": string,"jawaban_benar": number,"jawaban_id": string,"jenis": Database["public"]['Enums']["jenis_soal"],"mulai_pada": string,"nomor": number,"opsi": (string)[],"pertanyaan": string,"peserta": string,"pilihan": number,"selesai_pada": string,"skor": number,"skor_isian": number,"soal_id": string,"ujian_id": string
            }[]
                           },
"koreksi_honor":
{ Args: { "p_honor": number,"p_sesi_id": string }; Returns: undefined
                           },
"kunci_sesi":
{ Args: { "p_kunci": boolean,"p_sesi_id": string }; Returns: undefined
                           },
"mulai_ujian":
{ Args: { "p_ujian_id": string }; Returns: string
                           },
"nilai_isian":
{ Args: { "p_jawaban_id": string,"p_skor": number }; Returns: undefined
                           },
"nilai_saya":
{ Args: Record<PropertyKey, never>; Returns: {
              "nilai": number,"skor": number,"total_bobot": number,"ujian_id": string
            }[]
                           },
"pembayaran_saya":
{ Args: Record<PropertyKey, never>; Returns: {
              "id": string,"jumlah": number,"keterangan": string,"status": Database["public"]['Enums']["status_pembayaran"],"tanggal": string
            }[]
                           },
"peran_saya":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["peran_pengguna"]
                           },
"peserta_saya":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"saldo_honor":
{ Args: Record<PropertyKey, never>; Returns: {
              "honor_dibayar": number,"honor_terkumpul": number,"nama": string,"saldo": number,"tutor_id": string
            }[]
                           },
"selesai_ganti_sandi":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"selesai_ujian":
{ Args: { "p_percobaan_id": string }; Returns: undefined
                           },
"simpan_absensi":
{ Args: { "p_hadir_ids": (string)[],"p_jadwal_id": string,"p_tanggal": string }; Returns: string
                           },
"simpan_jawaban":
{ Args: { "p_isian": string,"p_percobaan_id": string,"p_pilihan": number,"p_soal_id": string }; Returns: undefined
                           },
"simpan_soal":
{ Args: { "p_audio_id": string,"p_bobot": number,"p_jawaban_benar": number,"p_jenis": Database["public"]['Enums']["jenis_soal"],"p_kunci_isian": string,"p_opsi": (string)[],"p_pertanyaan": string,"p_soal_id": string,"p_ujian_id": string,"p_urutan": number }; Returns: string
                           },
"skor_percobaan":
{ Args: { "p_percobaan_id": string }; Returns: {
              "isian_belum": number,"skor_isian": number,"skor_pg": number
            }[]
                           },
"toleransi_jawaban":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"ubah_meet":
{ Args: { "p_jadwal_id": string,"p_url": string }; Returns: undefined
                           },
"ujian_diperiksa":
{ Args: Record<PropertyKey, never>; Returns: {
              "diumumkan_pada": string,"durasi_menit": number,"id": string,"isian_belum": number,"judul": string,"kelas": string,"mulai": string,"peserta_mulai": number,"sekarang": string,"selesai": string
            }[]
                           },
"ujian_saya":
{ Args: Record<PropertyKey, never>; Returns: {
              "acak_opsi": boolean,"acak_soal": boolean,"batas_selesai": string,"durasi_menit": number,"id": string,"judul": string,"jumlah_soal": number,"kelas": string,"keterangan": string,"mulai": string,"percobaan_id": string,"sekarang": string,"selesai": string,"selesai_pada": string
            }[]
                           }
          }
          Enums: {
            "jenis_kas": "pemasukan"|"pengeluaran","jenis_soal": "pilihan_ganda"|"isian","peran_pengguna": "admin"|"tutor"|"peserta","status_pembayaran": "lunas"|"belum_lunas"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "jenis_kas": ["pemasukan", "pengeluaran"],"jenis_soal": ["pilihan_ganda", "isian"],"peran_pengguna": ["admin", "tutor", "peserta"],"status_pembayaran": ["lunas", "belum_lunas"]
          }
        }
} as const
